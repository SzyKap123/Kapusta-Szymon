import { randomUUID } from "node:crypto";
import { productOdds, roundOdds } from "../settlement";
import type { Coupon, GenerationRun, LedgerEntry, Pick, Profile, Subscription } from "../types";
import { isSubscriptionActive, type ListCouponsOptions, type Repository } from "./repository";

/**
 * Repozytorium w pamięci — do testów i trybu demonstracyjnego.
 * Odwzorowuje reguły bazy produkcyjnej: opublikowanych typów nie można zmieniać,
 * poza jednorazowym rozliczeniem.
 */
export class MemoryRepository implements Repository {
  settings = new Map<string, string>();
  runs: GenerationRun[] = [];
  coupons: Coupon[] = [];
  profiles: Profile[] = [];
  subscriptions: Subscription[] = [];
  access: { userId: string; couponId: string; ref: string }[] = [];
  consents: { userId: string; kind: string; text: string; reference: string; at: string }[] = [];
  ledger: LedgerEntry[] = [];

  async getSetting(key: string) {
    return this.settings.get(key) ?? null;
  }
  async setSetting(key: string, value: string) {
    this.settings.set(key, value);
  }

  async latestRunForDate(date: string) {
    const r = this.runs.filter((x) => x.runDate === date);
    return r[r.length - 1] ?? null;
  }
  async runsForDate(date: string) {
    return this.runs.filter((x) => x.runDate === date);
  }
  async startRun(date: string) {
    const run: GenerationRun = {
      id: randomUUID(),
      runDate: date,
      status: "running",
      message: null,
      startedAt: new Date().toISOString(),
      finishedAt: null,
    };
    this.runs.push(run);
    return run;
  }
  async finishRun(id: string, status: GenerationRun["status"], message: string | null) {
    const r = this.runs.find((x) => x.id === id);
    if (r) Object.assign(r, { status, message, finishedAt: new Date().toISOString() });
  }
  async listRuns(limit: number) {
    return [...this.runs].reverse().slice(0, limit);
  }

  async publishCoupons(inputs: Parameters<Repository["publishCoupons"]>[0]) {
    const created = inputs.map(({ input, contentHash, publishedAt }): Coupon => {
      const id = randomUUID();
      return {
        id,
        date: input.date,
        kind: input.kind,
        isFree: input.isFree,
        priceCents: input.priceCents,
        title: input.title,
        summary: input.summary,
        totalOdds: roundOdds(productOdds(input.picks)),
        status: "pending",
        settledOdds: null,
        contentHash,
        publishedAt,
        settledAt: null,
        picks: input.picks.map(
          (p): Pick => ({ ...p, id: randomUUID(), couponId: id, status: "pending", scoreHome: null, scoreAway: null, settledAt: null }),
        ),
      };
    });
    this.coupons.push(...created);
    return structuredClone(created);
  }

  async getCoupon(id: string) {
    const c = this.coupons.find((x) => x.id === id);
    return c ? structuredClone(c) : null;
  }

  private filter(opts: ListCouponsOptions) {
    return this.coupons
      .filter((c) => (!opts.from || c.date >= opts.from) && (!opts.to || c.date <= opts.to))
      .filter((c) =>
        !opts.status ? true : opts.status === "settled" ? c.status !== "pending" : c.status === opts.status,
      )
      .sort((a, b) => (a.date === b.date ? (a.kind === b.kind ? 0 : a.kind === "coupon_of_day" ? -1 : 1) : a.date < b.date ? 1 : -1));
  }
  async listCoupons(opts: ListCouponsOptions) {
    const off = opts.offset ?? 0;
    return structuredClone(this.filter(opts).slice(off, off + (opts.limit ?? 1000)));
  }
  async countCoupons(opts: ListCouponsOptions) {
    return this.filter(opts).length;
  }

  async listPendingPicks() {
    return structuredClone(this.coupons.flatMap((c) => c.picks).filter((p) => p.status === "pending"));
  }

  async settlePick(id: string, status: Pick["status"], scoreHome: number | null, scoreAway: number | null) {
    const pick = this.coupons.flatMap((c) => c.picks).find((p) => p.id === id);
    if (!pick) throw new Error("Brak typu");
    if (pick.status !== "pending") throw new Error("Typ jest już rozliczony i nie może być zmieniony");
    Object.assign(pick, { status, scoreHome, scoreAway, settledAt: new Date().toISOString() });
  }
  async settleCoupon(id: string, status: Coupon["status"], settledOdds: number | null) {
    const c = this.coupons.find((x) => x.id === id);
    if (!c) throw new Error("Brak kuponu");
    if (c.status !== "pending") throw new Error("Kupon jest już rozliczony i nie może być zmieniony");
    Object.assign(c, { status, settledOdds, settledAt: new Date().toISOString() });
  }

  async getProfile(userId: string) {
    return this.profiles.find((p) => p.id === userId) ?? null;
  }
  async getProfileByCustomerId(customerId: string) {
    return this.profiles.find((p) => p.stripeCustomerId === customerId) ?? null;
  }
  async setStripeCustomerId(userId: string, customerId: string) {
    const p = this.profiles.find((x) => x.id === userId);
    if (p) p.stripeCustomerId = customerId;
  }
  async confirmAdult(userId: string) {
    const p = this.profiles.find((x) => x.id === userId);
    if (p && !p.adultConfirmedAt) p.adultConfirmedAt = new Date().toISOString();
  }
  async countUsers() {
    return this.profiles.length;
  }

  async upsertSubscription(sub: Subscription) {
    const i = this.subscriptions.findIndex((s) => s.stripeSubscriptionId === sub.stripeSubscriptionId);
    if (i >= 0) this.subscriptions[i] = sub;
    else this.subscriptions.push(sub);
  }
  async getSubscription(userId: string) {
    const subs = this.subscriptions.filter((s) => s.userId === userId);
    return subs.find((s) => isSubscriptionActive(s, new Date())) ?? subs[subs.length - 1] ?? null;
  }
  async countActiveSubscribers(now: Date) {
    return new Set(this.subscriptions.filter((s) => isSubscriptionActive(s, now)).map((s) => s.userId)).size;
  }
  async listActiveSubscriberEmails(now: Date) {
    const ids = new Set(this.subscriptions.filter((s) => isSubscriptionActive(s, now)).map((s) => s.userId));
    return this.profiles.filter((p) => ids.has(p.id)).map((p) => p.email);
  }
  async grantCouponAccess(userId: string, couponId: string, ref: string) {
    if (!this.access.some((a) => a.userId === userId && a.couponId === couponId)) this.access.push({ userId, couponId, ref });
  }
  async hasCouponAccess(userId: string, couponId: string) {
    return this.access.some((a) => a.userId === userId && a.couponId === couponId);
  }
  async listAccessibleCouponIds(userId: string) {
    return this.access.filter((a) => a.userId === userId).map((a) => a.couponId);
  }
  async recordConsent(userId: string, kind: string, text: string, reference: string) {
    this.consents.push({ userId, kind, text, reference, at: new Date().toISOString() });
  }

  async upsertLedgerEntry(entry: Omit<LedgerEntry, "id">) {
    const existing = this.ledger.find((l) => l.externalId === entry.externalId);
    if (existing) {
      Object.assign(existing, entry);
      return { created: false };
    }
    this.ledger.push({ ...entry, id: randomUUID() });
    return { created: true };
  }
  async listLedger(fromIso?: string, toIso?: string) {
    return this.ledger
      .filter((l) => (!fromIso || l.occurredAt >= fromIso) && (!toIso || l.occurredAt < toIso))
      .sort((a, b) => (a.occurredAt < b.occurredAt ? -1 : 1));
  }
}
