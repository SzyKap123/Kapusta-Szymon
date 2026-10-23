import type Stripe from "stripe";
import { isSubscriptionActive, type Repository } from "../db/repository";
import type { Coupon, Profile } from "../types";

// Treść zgody wymaganej przed zakupem treści cyfrowej (art. 38 ust. 1 pkt 13 ustawy o prawach konsumenta).
export const DIGITAL_CONTENT_CONSENT =
  "Wyrażam zgodę na natychmiastowe dostarczenie treści cyfrowej przed upływem terminu do odstąpienia od umowy i przyjmuję do wiadomości, że w związku z tym tracę prawo do odstąpienia od umowy.";

export type CheckoutKind = "coupon" | "subscription";

export class CheckoutError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
  }
}

export interface CheckoutRequest {
  kind: CheckoutKind;
  couponId?: string;
  consent: boolean;
}

/** Walidacja przed utworzeniem płatności. Rzuca CheckoutError z komunikatem dla użytkownika. */
export async function validateCheckout(
  repo: Repository,
  profile: Profile | null,
  req: CheckoutRequest,
  now: Date = new Date(),
): Promise<{ coupon?: Coupon }> {
  if (!profile) throw new CheckoutError("Zaloguj się, aby kupić dostęp.", "not_logged_in");
  if (!profile.adultConfirmedAt) throw new CheckoutError("Najpierw potwierdź w swoim koncie, że masz ukończone 18 lat.", "not_adult");
  if (!req.consent) {
    throw new CheckoutError("Zaznacz zgodę na natychmiastowe dostarczenie treści cyfrowej, aby kontynuować.", "no_consent");
  }

  const sub = await repo.getSubscription(profile.id);
  const subscribed = isSubscriptionActive(sub, now);

  if (req.kind === "subscription") {
    if (subscribed) throw new CheckoutError("Masz już aktywną subskrypcję.", "already_subscribed");
    return {};
  }

  if (!req.couponId) throw new CheckoutError("Nie wskazano kuponu.", "no_coupon");
  const coupon = await repo.getCoupon(req.couponId);
  if (!coupon) throw new CheckoutError("Kupon nie istnieje.", "not_found");
  if (coupon.isFree) throw new CheckoutError("Ten kupon jest darmowy.", "free");
  if (subscribed || (await repo.hasCouponAccess(profile.id, coupon.id))) {
    throw new CheckoutError("Masz już dostęp do tego kuponu.", "already_has_access");
  }
  const firstKickoff = Math.min(...coupon.picks.map((p) => new Date(p.kickoff).getTime()));
  if (coupon.status !== "pending" || firstKickoff <= now.getTime()) {
    throw new CheckoutError("Sprzedaż tego kuponu jest zamknięta — pierwszy mecz już się rozpoczął.", "closed");
  }
  return { coupon };
}

export interface CheckoutDeps {
  repo: Repository;
  stripe: Stripe;
  siteUrl: string;
  siteName: string;
  subscriptionPriceCents: number;
}

async function ensureCustomer(deps: CheckoutDeps, profile: Profile): Promise<string> {
  if (profile.stripeCustomerId) return profile.stripeCustomerId;
  const customer = await deps.stripe.customers.create({ email: profile.email, metadata: { userId: profile.id } });
  await deps.repo.setStripeCustomerId(profile.id, customer.id);
  return customer.id;
}

/** Tworzy sesję płatności Stripe Checkout i zapisuje zgodę użytkownika. Zwraca adres płatności. */
export async function createCheckoutSession(
  deps: CheckoutDeps,
  profile: Profile,
  req: CheckoutRequest,
  coupon?: Coupon,
): Promise<string> {
  const customer = await ensureCustomer(deps, profile);
  const consentAt = new Date().toISOString();
  const common = {
    customer,
    client_reference_id: profile.id,
    locale: "pl" as const,
    success_url: `${deps.siteUrl}/konto?platnosc=ok`,
    cancel_url: `${deps.siteUrl}/${req.kind === "coupon" ? "" : "cennik"}?platnosc=anulowana`,
  };

  let session: Stripe.Checkout.Session;
  if (req.kind === "subscription") {
    session = await deps.stripe.checkout.sessions.create({
      ...common,
      mode: "subscription",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "pln",
            unit_amount: deps.subscriptionPriceCents,
            recurring: { interval: "month" },
            product_data: { name: `${deps.siteName} — subskrypcja miesięczna` },
          },
        },
      ],
      subscription_data: { metadata: { userId: profile.id, consentAt } },
      metadata: { userId: profile.id, kind: "subscription", consentAt },
    });
  } else {
    if (!coupon) throw new CheckoutError("Nie wskazano kuponu.", "no_coupon");
    session = await deps.stripe.checkout.sessions.create({
      ...common,
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "pln",
            unit_amount: coupon.priceCents,
            product_data: { name: `${coupon.title} (${coupon.date})` },
          },
        },
      ],
      payment_intent_data: { metadata: { userId: profile.id, couponId: coupon.id } },
      metadata: {
        userId: profile.id,
        couponId: coupon.id,
        couponTitle: `${coupon.title} (${coupon.date})`.slice(0, 450),
        kind: "coupon",
        consentAt,
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });
  }

  await deps.repo.recordConsent(profile.id, `digital_content_${req.kind}`, DIGITAL_CONTENT_CONSENT, session.id);
  if (!session.url) throw new Error("Stripe nie zwrócił adresu płatności");
  return session.url;
}
