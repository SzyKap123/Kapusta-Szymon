import Stripe from "stripe";
import { describe, expect, it } from "vitest";
import { canViewCoupon, redactCoupon, ANONYMOUS } from "@/lib/access";
import { MemoryRepository } from "@/lib/db/memoryRepo";
import { CheckoutError, createCheckoutSession, DIGITAL_CONTENT_CONSENT, validateCheckout } from "@/lib/payments/checkout";
import { handleStripeEvent, processWebhook } from "@/lib/payments/webhook";
import { currentQuarterBounds, ledgerToCsv, limitStatus, sumCents, warsawDayStartIso } from "@/lib/revenue";
import { computeStats } from "@/lib/stats";
import type { CouponInput, Profile } from "@/lib/types";

const NOW = new Date("2026-10-23T10:00:00Z");

function profile(overrides: Partial<Profile> = {}): Profile {
  return { id: "u1", email: "jan@example.pl", adultConfirmedAt: "2026-10-01T00:00:00Z", termsAcceptedAt: "x", stripeCustomerId: "cus_1", createdAt: "x", ...overrides };
}

async function setup(kickoff = "2026-10-23T18:00:00Z") {
  const repo = new MemoryRepository();
  repo.profiles.push(profile());
  const input: CouponInput = {
    date: "2026-10-23",
    kind: "coupon_of_day",
    isFree: false,
    priceCents: 900,
    title: "Kupon dnia — kurs ok. 2.00",
    summary: "",
    picks: [
      { fixtureId: 1, league: "L", homeTeam: "A", awayTeam: "B", kickoff, market: "1X2", selection: "home", odds: 2, confidence: 3, reasoning: "Uzasadnienie." },
    ],
  };
  const free: CouponInput = { ...input, kind: "single", isFree: true };
  const [paid, freeC] = await repo.publishCoupons([input, free].map((i) => ({ input: i, contentHash: "h", publishedAt: "x" })));
  return { repo, paid, free: freeC };
}

function event<T>(type: string, object: T, created = 1_792_756_800): Stripe.Event {
  return { id: `evt_${Math.random()}`, type, created, data: { object } } as unknown as Stripe.Event;
}

describe("walidacja zakupu", () => {
  it("wymaga logowania, oświadczenia 18+ i zgody na dostarczenie treści cyfrowej", async () => {
    const { repo, paid } = await setup();
    const req = { kind: "coupon" as const, couponId: paid.id, consent: true };
    await expect(validateCheckout(repo, null, req, NOW)).rejects.toMatchObject({ code: "not_logged_in" });
    await expect(validateCheckout(repo, profile({ adultConfirmedAt: null }), req, NOW)).rejects.toMatchObject({ code: "not_adult" });
    await expect(validateCheckout(repo, profile(), { ...req, consent: false }, NOW)).rejects.toMatchObject({ code: "no_consent" });
    await expect(validateCheckout(repo, profile(), req, NOW)).resolves.toMatchObject({ coupon: { id: paid.id } });
  });

  it("blokuje zakup po rozpoczęciu pierwszego meczu, kuponów darmowych i ponownego zakupu", async () => {
    const started = await setup("2026-10-23T09:00:00Z");
    await expect(validateCheckout(started.repo, profile(), { kind: "coupon", couponId: started.paid.id, consent: true }, NOW)).rejects.toMatchObject({ code: "closed" });

    const { repo, paid, free } = await setup();
    await expect(validateCheckout(repo, profile(), { kind: "coupon", couponId: free.id, consent: true }, NOW)).rejects.toMatchObject({ code: "free" });
    await repo.grantCouponAccess("u1", paid.id, "pi_1");
    await expect(validateCheckout(repo, profile(), { kind: "coupon", couponId: paid.id, consent: true }, NOW)).rejects.toBeInstanceOf(CheckoutError);
  });

  it("nie pozwala kupić drugiej subskrypcji", async () => {
    const { repo } = await setup();
    await repo.upsertSubscription({ userId: "u1", stripeSubscriptionId: "sub_1", status: "active", currentPeriodEnd: "2026-11-23T00:00:00Z", cancelAtPeriodEnd: false });
    await expect(validateCheckout(repo, profile(), { kind: "subscription", consent: true }, NOW)).rejects.toMatchObject({ code: "already_subscribed" });
  });

  it("tworzy sesję Stripe w PLN i zapisuje treść zgody", async () => {
    const { repo, paid } = await setup();
    const calls: Stripe.Checkout.SessionCreateParams[] = [];
    const fakeStripe = {
      customers: { create: async () => ({ id: "cus_new" }) },
      checkout: { sessions: { create: async (p: Stripe.Checkout.SessionCreateParams) => (calls.push(p), { id: "cs_1", url: "https://checkout.stripe.com/x" }) } },
    } as unknown as Stripe;
    const deps = { repo, stripe: fakeStripe, siteUrl: "https://typy.pl", siteName: "Typy AI", subscriptionPriceCents: 3900 };

    const url = await createCheckoutSession(deps, profile({ stripeCustomerId: null }), { kind: "coupon", couponId: paid.id, consent: true }, paid);
    expect(url).toBe("https://checkout.stripe.com/x");
    expect(calls[0]).toMatchObject({ mode: "payment", customer: "cus_new", locale: "pl", metadata: { couponId: paid.id, userId: "u1" } });
    expect(calls[0].line_items?.[0].price_data).toMatchObject({ currency: "pln", unit_amount: 900 });
    expect(repo.profiles[0].stripeCustomerId).toBe("cus_new");
    expect(repo.consents[0]).toMatchObject({ userId: "u1", text: DIGITAL_CONTENT_CONSENT, reference: "cs_1" });

    await createCheckoutSession(deps, profile(), { kind: "subscription", consent: true });
    expect(calls[1]).toMatchObject({ mode: "subscription", customer: "cus_1" });
    expect(calls[1].line_items?.[0].price_data).toMatchObject({ unit_amount: 3900, recurring: { interval: "month" } });
  });
});

describe("zdarzenia Stripe", () => {
  it("opłacony kupon: wpis w ewidencji + dostęp; ponowne zdarzenie nie dubluje wpisu", async () => {
    const { repo, paid } = await setup();
    const session = { id: "cs_1", mode: "payment", payment_status: "paid", payment_intent: "pi_1", amount_total: 900, created: 1_792_756_800, metadata: { userId: "u1", couponId: paid.id, couponTitle: "Kupon dnia" } };
    expect(await handleStripeEvent(repo, event("checkout.session.completed", session))).toBe("coupon_granted");
    await handleStripeEvent(repo, event("checkout.session.completed", session));
    expect(repo.ledger).toHaveLength(1);
    expect(repo.ledger[0]).toMatchObject({ kind: "coupon", amountCents: 900, externalId: "pi_1" });
    expect(await repo.hasCouponAccess("u1", paid.id)).toBe(true);
  });

  it("wysyła potwierdzenie zakupu (trwały nośnik) tylko raz", async () => {
    const { repo, paid } = await setup();
    const sent: string[] = [];
    const onPurchase = async (p: { description: string }) => void sent.push(p.description);
    const session = { id: "cs_5", mode: "payment", payment_status: "paid", payment_intent: "pi_5", amount_total: 900, created: 1, metadata: { userId: "u1", couponId: paid.id, couponTitle: "Kupon dnia" } };
    await handleStripeEvent(repo, event("checkout.session.completed", session), onPurchase);
    await handleStripeEvent(repo, event("checkout.session.completed", session), onPurchase);
    expect(sent).toEqual(["Kupon Kupon dnia"]);

    const invoice = { id: "in_9", customer: "cus_1", amount_paid: 3900, created: 1, billing_reason: "subscription_create", status_transitions: { paid_at: 1 } };
    await handleStripeEvent(repo, event("invoice.paid", invoice), onPurchase);
    await handleStripeEvent(repo, event("invoice.paid", { ...invoice, id: "in_10", billing_reason: "subscription_cycle" }), onPurchase);
    expect(sent).toHaveLength(2);
  });

  it("płatność oczekująca nie daje dostępu, dopiero async_payment_succeeded", async () => {
    const { repo, paid } = await setup();
    const session = { id: "cs_2", mode: "payment", payment_status: "unpaid", payment_intent: "pi_2", amount_total: 900, created: 1, metadata: { userId: "u1", couponId: paid.id } };
    expect(await handleStripeEvent(repo, event("checkout.session.completed", session))).toBe("awaiting_payment");
    expect(await repo.hasCouponAccess("u1", paid.id)).toBe(false);
    await handleStripeEvent(repo, event("checkout.session.async_payment_succeeded", { ...session, payment_status: "paid" }));
    expect(await repo.hasCouponAccess("u1", paid.id)).toBe(true);
  });

  it("subskrypcja: zapis statusu, opłacone faktury w ewidencji, anulowanie", async () => {
    const { repo } = await setup();
    const sub = { id: "sub_1", customer: "cus_1", status: "active", cancel_at_period_end: false, cancel_at: null, metadata: {}, items: { data: [{ current_period_end: 1_795_435_200 }] } };
    await handleStripeEvent(repo, event("customer.subscription.created", sub));
    expect(await repo.getSubscription("u1")).toMatchObject({ status: "active", currentPeriodEnd: new Date(1_795_435_200_000).toISOString() });

    await handleStripeEvent(repo, event("invoice.paid", { id: "in_1", customer: "cus_1", amount_paid: 3900, created: 1_792_756_800, status_transitions: { paid_at: 1_792_756_800 } }));
    expect(repo.ledger[0]).toMatchObject({ kind: "subscription", amountCents: 3900, userId: "u1" });

    await handleStripeEvent(repo, event("customer.subscription.updated", { ...sub, cancel_at_period_end: true }));
    expect((await repo.getSubscription("u1"))?.cancelAtPeriodEnd).toBe(true);
    await handleStripeEvent(repo, event("customer.subscription.deleted", { ...sub, status: "canceled" }));
    expect(await repo.countActiveSubscribers(NOW)).toBe(0);
  });

  it("zwrot zapisuje ujemny wpis, kolejne zwroty częściowe aktualizują ten sam wpis", async () => {
    const { repo } = await setup();
    await handleStripeEvent(repo, event("charge.refunded", { id: "ch_1", customer: "cus_1", amount_refunded: 400, payment_intent: "pi_1", metadata: {} }));
    await handleStripeEvent(repo, event("charge.refunded", { id: "ch_1", customer: "cus_1", amount_refunded: 900, payment_intent: "pi_1", metadata: {} }));
    expect(repo.ledger).toHaveLength(1);
    expect(repo.ledger[0]).toMatchObject({ kind: "refund", amountCents: -900 });
  });

  it("weryfikuje podpis webhooka", async () => {
    const { repo, paid } = await setup();
    const stripe = new Stripe("sk_test_dummy");
    const secret = "whsec_test";
    const payload = JSON.stringify(
      event("checkout.session.completed", { id: "cs_9", mode: "payment", payment_status: "paid", payment_intent: "pi_9", amount_total: 900, created: 1, metadata: { userId: "u1", couponId: paid.id } }),
    );
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
    expect(await processWebhook(stripe, repo, payload, header, secret)).toEqual({ status: 200, body: "coupon_granted" });
    expect((await processWebhook(stripe, repo, payload, "t=1,v1=zly", secret)).status).toBe(400);
    expect((await processWebhook(stripe, repo, payload, null, secret)).status).toBe(400);
  });
});

describe("dostęp do treści", () => {
  it("płatny kupon ukryty przed rozliczeniem, widoczny dla kupującego, subskrybenta i po rozliczeniu", async () => {
    const { paid, free } = await setup();
    expect(canViewCoupon(free, ANONYMOUS)).toBe(true);
    expect(canViewCoupon(paid, ANONYMOUS)).toBe(false);
    const redacted = redactCoupon(paid, ANONYMOUS);
    expect(JSON.stringify(redacted)).not.toContain("Uzasadnienie");
    expect(JSON.stringify(redacted)).not.toContain('"selection"');
    expect(canViewCoupon(paid, { ...ANONYMOUS, userId: "u1", purchasedCouponIds: new Set([paid.id]) })).toBe(true);
    expect(canViewCoupon(paid, { ...ANONYMOUS, userId: "u1", subscribed: true })).toBe(true);
    expect(canViewCoupon({ ...paid, status: "lost" }, ANONYMOUS)).toBe(true);
  });
});

describe("przychody i ewidencja", () => {
  it("granice kwartału w czasie polskim", () => {
    expect(currentQuarterBounds(new Date("2026-10-23T10:00:00Z"))).toMatchObject({ quarter: 4, from: "2026-10-01", to: "2026-12-31", fromIso: "2026-09-30T22:00:00.000Z", toIso: "2026-12-31T23:00:00.000Z" });
    expect(warsawDayStartIso("2026-01-01")).toBe("2025-12-31T23:00:00.000Z");
  });

  it("ostrzega przy 80% i 95% limitu 10 813,50 zł", () => {
    expect(limitStatus(500_000, 1_081_350).level).toBe("ok");
    expect(limitStatus(870_000, 1_081_350).level).toBe("warning");
    expect(limitStatus(1_030_000, 1_081_350).level).toBe("danger");
    expect(limitStatus(1_100_000, 1_081_350).level).toBe("exceeded");
  });

  it("CSV: polski format, suma narastająco w kwartale, zwroty ujemne", () => {
    const entries = [
      { id: "1", externalId: "pi_1", userId: null, kind: "coupon" as const, amountCents: 900, description: "Kupon; dnia", occurredAt: "2026-09-30T21:00:00Z" },
      { id: "2", externalId: "pi_2", userId: null, kind: "subscription" as const, amountCents: 3900, description: "Subskrypcja", occurredAt: "2026-10-02T10:00:00Z" },
      { id: "3", externalId: "refund_ch", userId: null, kind: "refund" as const, amountCents: -900, description: "Zwrot", occurredAt: "2026-10-03T10:00:00Z" },
    ];
    const csv = ledgerToCsv(entries);
    const lines = csv.replace("﻿", "").trim().split("\r\n");
    expect(lines[0]).toContain("Data sprzedaży");
    expect(lines[1]).toBe('1;2026-09-30;Kupon;"Kupon; dnia";9,00;9,00;pi_1');
    expect(lines[2]).toBe("2;2026-10-02;Subskrypcja;Subskrypcja;39,00;39,00;pi_2");
    expect(lines[3]).toBe("3;2026-10-03;Zwrot;Zwrot;-9,00;30,00;refund_ch");
    expect(sumCents(entries)).toBe(3900);
  });
});

describe("statystyki", () => {
  it("liczy % trafień i yield przy stałej stawce, zwroty pomija", () => {
    const s = computeStats([
      { status: "won", kind: "single", isFree: false, totalOdds: 2.0, settledOdds: 2.0 },
      { status: "lost", kind: "single", isFree: false, totalOdds: 1.8, settledOdds: 1.8 },
      { status: "lost", kind: "single", isFree: false, totalOdds: 1.9, settledOdds: 1.9 },
      { status: "void", kind: "single", isFree: false, totalOdds: 1.5, settledOdds: null },
      { status: "pending", kind: "single", isFree: false, totalOdds: 1.5, settledOdds: null },
    ]);
    expect(s).toMatchObject({ won: 1, lost: 2, void: 1, pending: 1, profitUnits: -1 });
    expect(s.hitRate).toBeCloseTo(33.33, 1);
    expect(s.yieldPct).toBeCloseTo(-33.33, 1);
  });
});
