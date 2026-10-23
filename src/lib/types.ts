// Wspólne typy domenowe serwisu.

export type MarketCode = "1X2" | "DC" | "OU" | "BTTS";

export type PickStatus = "pending" | "won" | "lost" | "void";
export type CouponStatus = PickStatus;
export type CouponKind = "coupon_of_day" | "single";

export interface PickInput {
  fixtureId: number;
  league: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string; // ISO (UTC)
  market: MarketCode;
  selection: string; // np. "home", "1X", "over_2.5", "yes"
  odds: number; // przybliżony (mediana rynkowa)
  confidence: number; // 1–5
  reasoning: string;
}

export interface Pick extends PickInput {
  id: string;
  couponId: string;
  status: PickStatus;
  scoreHome: number | null;
  scoreAway: number | null;
  settledAt: string | null;
}

export interface CouponInput {
  date: string; // YYYY-MM-DD (czas polski)
  kind: CouponKind;
  isFree: boolean;
  priceCents: number;
  title: string;
  summary: string;
  picks: PickInput[];
}

export interface Coupon {
  id: string;
  date: string;
  kind: CouponKind;
  isFree: boolean;
  priceCents: number;
  title: string;
  summary: string;
  totalOdds: number;
  status: CouponStatus;
  settledOdds: number | null;
  contentHash: string;
  publishedAt: string;
  settledAt: string | null;
  picks: Pick[];
}

export type RunStatus = "running" | "success" | "failed" | "no_matches" | "paused";

export interface GenerationRun {
  id: string;
  runDate: string;
  status: RunStatus;
  message: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface Profile {
  id: string;
  email: string;
  adultConfirmedAt: string | null;
  termsAcceptedAt: string | null;
  stripeCustomerId: string | null;
  createdAt: string;
}

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused";

export interface Subscription {
  userId: string;
  stripeSubscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export type LedgerKind = "coupon" | "subscription" | "refund";

/** Wpis w ewidencji sprzedaży (kwoty w groszach, brutto). Zwroty są ujemne. */
export interface LedgerEntry {
  id: string;
  externalId: string; // unikalny identyfikator ze Stripe
  userId: string | null;
  kind: LedgerKind;
  amountCents: number;
  description: string;
  occurredAt: string;
}
