import type Stripe from "stripe";
import type { Repository } from "../db/repository";
import type { SubscriptionStatus } from "../types";

// Obsługa zdarzeń Stripe. Każde zdarzenie może przyjść kilka razy —
// zapisy są idempotentne (klucz: identyfikator Stripe).

function idOf(x: string | { id: string } | null | undefined): string | null {
  if (!x) return null;
  return typeof x === "string" ? x : x.id;
}

async function userIdForCustomer(repo: Repository, customer: string | null, fallback?: string | null) {
  if (fallback) return fallback;
  if (!customer) return null;
  return (await repo.getProfileByCustomerId(customer))?.id ?? null;
}

function periodEnd(sub: Stripe.Subscription): string | null {
  const fromItems = sub.items?.data?.map((i) => i.current_period_end).filter(Boolean) as number[] | undefined;
  const legacy = (sub as unknown as { current_period_end?: number }).current_period_end;
  const ts = fromItems?.length ? Math.max(...fromItems) : legacy;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

/** Dane do e-maila potwierdzającego zawarcie umowy (trwały nośnik, art. 21 ustawy o prawach konsumenta). */
export interface PurchaseConfirmation {
  userId: string;
  kind: "coupon" | "subscription";
  description: string;
  amountCents: number;
  occurredAt: string;
}
export type OnPurchase = (info: PurchaseConfirmation) => Promise<void>;

async function handleCouponPayment(repo: Repository, session: Stripe.Checkout.Session, onPurchase?: OnPurchase) {
  if (session.payment_status !== "paid") return "awaiting_payment";
  const userId = session.metadata?.userId ?? session.client_reference_id;
  const couponId = session.metadata?.couponId;
  if (!userId || !couponId) throw new Error(`Sesja ${session.id} bez userId/couponId w metadata`);
  const externalId = idOf(session.payment_intent) ?? session.id;
  const entry = {
    externalId,
    userId,
    kind: "coupon" as const,
    amountCents: session.amount_total ?? 0,
    description: `Kupon ${session.metadata?.couponTitle ?? couponId}`.slice(0, 200),
    occurredAt: new Date(session.created * 1000).toISOString(),
  };
  const { created } = await repo.upsertLedgerEntry(entry);
  await repo.grantCouponAccess(userId, couponId, externalId);
  if (created) await safeNotify(onPurchase, { ...entry, userId });
  return "coupon_granted";
}

async function safeNotify(onPurchase: OnPurchase | undefined, info: PurchaseConfirmation) {
  if (!onPurchase) return;
  try {
    await onPurchase(info);
  } catch (e) {
    console.error("Nie wysłano potwierdzenia zakupu", e);
  }
}

export async function handleStripeEvent(repo: Repository, event: Stripe.Event, onPurchase?: OnPurchase): Promise<string> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "payment") return handleCouponPayment(repo, session, onPurchase);
      return "ignored_subscription_checkout"; // subskrypcję obsługują zdarzenia customer.subscription.*
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = await userIdForCustomer(repo, idOf(sub.customer), sub.metadata?.userId);
      if (!userId) throw new Error(`Nie znaleziono użytkownika dla subskrypcji ${sub.id}`);
      await repo.upsertSubscription({
        userId,
        stripeSubscriptionId: sub.id,
        status: sub.status as SubscriptionStatus,
        currentPeriodEnd: periodEnd(sub),
        cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end || sub.cancel_at),
      });
      return "subscription_saved";
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      if (!invoice.amount_paid) return "ignored_zero_invoice";
      const userId = await userIdForCustomer(repo, idOf(invoice.customer));
      const paidAt = invoice.status_transitions?.paid_at ?? invoice.created;
      const entry = {
        externalId: invoice.id ?? `invoice_${event.id}`,
        userId,
        kind: "subscription" as const,
        amountCents: invoice.amount_paid,
        description: "Subskrypcja miesięczna",
        occurredAt: new Date(paidAt * 1000).toISOString(),
      };
      const { created } = await repo.upsertLedgerEntry(entry);
      if (created && userId && invoice.billing_reason === "subscription_create") {
        await safeNotify(onPurchase, { ...entry, userId });
      }
      return "subscription_payment_recorded";
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      // Jeden wpis na płatność, z łączną kwotą zwrotów (obsługuje kilka zwrotów częściowych).
      await repo.upsertLedgerEntry({
        externalId: `refund_${charge.id}`,
        userId: await userIdForCustomer(repo, idOf(charge.customer), charge.metadata?.userId),
        kind: "refund",
        amountCents: -charge.amount_refunded,
        description: `Zwrot płatności ${idOf(charge.payment_intent) ?? charge.id}`,
        occurredAt: new Date(event.created * 1000).toISOString(),
      });
      return "refund_recorded";
    }

    default:
      return "ignored";
  }
}

/** Weryfikuje podpis Stripe i obsługuje zdarzenie. Używane przez /api/stripe/webhook. */
export async function processWebhook(
  stripe: Stripe,
  repo: Repository,
  rawBody: string,
  signature: string | null,
  secret: string,
  onPurchase?: OnPurchase,
): Promise<{ status: number; body: string }> {
  if (!signature) return { status: 400, body: "Brak podpisu" };
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return { status: 400, body: "Nieprawidłowy podpis" };
  }
  try {
    const result = await handleStripeEvent(repo, event, onPurchase);
    return { status: 200, body: result };
  } catch (e) {
    console.error("Błąd obsługi zdarzenia Stripe", event.type, e);
    // 500 => Stripe ponowi dostarczenie zdarzenia później.
    return { status: 500, body: "Błąd obsługi" };
  }
}
