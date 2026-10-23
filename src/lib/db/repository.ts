import type {
  Coupon,
  CouponInput,
  CouponStatus,
  GenerationRun,
  LedgerEntry,
  Pick,
  PickStatus,
  Profile,
  RunStatus,
  Subscription,
} from "../types";

export interface ListCouponsOptions {
  from?: string;
  to?: string;
  status?: CouponStatus | "settled";
  limit?: number;
  offset?: number;
}

/** Dostęp do danych. Implementacje: Supabase (produkcja) i pamięć (testy, tryb demo). */
export interface Repository {
  // Ustawienia
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;

  // Uruchomienia generowania
  latestRunForDate(date: string): Promise<GenerationRun | null>;
  runsForDate(date: string): Promise<GenerationRun[]>;
  startRun(date: string): Promise<GenerationRun>;
  finishRun(id: string, status: RunStatus, message: string | null): Promise<void>;
  listRuns(limit: number): Promise<GenerationRun[]>;

  // Kupony i typy (publikacja jest nieodwracalna)
  publishCoupons(inputs: { input: CouponInput; contentHash: string; publishedAt: string }[]): Promise<Coupon[]>;
  getCoupon(id: string): Promise<Coupon | null>;
  listCoupons(opts: ListCouponsOptions): Promise<Coupon[]>;
  countCoupons(opts: Omit<ListCouponsOptions, "limit" | "offset">): Promise<number>;
  listPendingPicks(): Promise<Pick[]>;
  settlePick(id: string, status: Exclude<PickStatus, "pending">, scoreHome: number | null, scoreAway: number | null): Promise<void>;
  settleCoupon(id: string, status: Exclude<CouponStatus, "pending">, settledOdds: number | null): Promise<void>;

  // Użytkownicy
  getProfile(userId: string): Promise<Profile | null>;
  getProfileByCustomerId(customerId: string): Promise<Profile | null>;
  setStripeCustomerId(userId: string, customerId: string): Promise<void>;
  confirmAdult(userId: string): Promise<void>;
  countUsers(): Promise<number>;

  // Subskrypcje i zakupy
  upsertSubscription(sub: Subscription): Promise<void>;
  getSubscription(userId: string): Promise<Subscription | null>;
  countActiveSubscribers(now: Date): Promise<number>;
  listActiveSubscriberEmails(now: Date): Promise<string[]>;
  grantCouponAccess(userId: string, couponId: string, ledgerExternalId: string): Promise<void>;
  hasCouponAccess(userId: string, couponId: string): Promise<boolean>;
  listAccessibleCouponIds(userId: string): Promise<string[]>;
  recordConsent(userId: string, kind: string, text: string, reference: string): Promise<void>;

  // Ewidencja sprzedaży (idempotentnie po externalId)
  upsertLedgerEntry(entry: Omit<LedgerEntry, "id">): Promise<{ created: boolean }>;
  listLedger(fromIso?: string, toIso?: string): Promise<LedgerEntry[]>;
}

export function isSubscriptionActive(sub: Subscription | null, now: Date): boolean {
  if (!sub) return false;
  if (sub.status !== "active" && sub.status !== "trialing") return false;
  return !sub.currentPeriodEnd || new Date(sub.currentPeriodEnd).getTime() > now.getTime();
}
