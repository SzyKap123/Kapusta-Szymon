import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { productOdds, roundOdds } from "../settlement";
import type { Coupon, GenerationRun, LedgerEntry, Pick, Profile, Subscription } from "../types";
import { isSubscriptionActive, type ListCouponsOptions, type Repository } from "./repository";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

function check<T>(res: { data: T; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`Baza danych (${what}): ${res.error.message}`);
  return res.data;
}

const num = (v: unknown) => (v == null ? null : Number(v));

function mapPick(r: Row): Pick {
  return {
    id: r.id,
    couponId: r.coupon_id,
    fixtureId: Number(r.fixture_id),
    league: r.league,
    homeTeam: r.home_team,
    awayTeam: r.away_team,
    kickoff: new Date(r.kickoff).toISOString(),
    market: r.market,
    selection: r.selection,
    odds: Number(r.odds),
    confidence: r.confidence,
    reasoning: r.reasoning,
    status: r.status,
    scoreHome: r.score_home,
    scoreAway: r.score_away,
    settledAt: r.settled_at,
  };
}

function mapCoupon(r: Row): Coupon {
  const picks = ((r.picks ?? []) as Row[]).sort((a, b) => a.position - b.position).map(mapPick);
  return {
    id: r.id,
    date: r.date,
    kind: r.kind,
    isFree: r.is_free,
    priceCents: r.price_cents,
    title: r.title,
    summary: r.summary,
    totalOdds: Number(r.total_odds),
    status: r.status,
    settledOdds: num(r.settled_odds),
    contentHash: r.content_hash,
    publishedAt: r.published_at,
    settledAt: r.settled_at,
    picks,
  };
}

function mapRun(r: Row): GenerationRun {
  return {
    id: r.id,
    runDate: r.run_date,
    status: r.status,
    message: r.message,
    startedAt: r.started_at,
    finishedAt: r.finished_at,
  };
}

function mapProfile(r: Row): Profile {
  return {
    id: r.id,
    email: r.email,
    adultConfirmedAt: r.adult_confirmed_at,
    termsAcceptedAt: r.terms_accepted_at,
    stripeCustomerId: r.stripe_customer_id,
    createdAt: r.created_at,
  };
}

function mapSub(r: Row): Subscription {
  return {
    userId: r.user_id,
    stripeSubscriptionId: r.stripe_subscription_id,
    status: r.status,
    currentPeriodEnd: r.current_period_end,
    cancelAtPeriodEnd: r.cancel_at_period_end,
  };
}

export class SupabaseRepository implements Repository {
  private readonly db: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.db = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async getSetting(key: string) {
    const data = check(await this.db.from("settings").select("value").eq("key", key).maybeSingle(), "settings");
    return (data as Row | null)?.value ?? null;
  }
  async setSetting(key: string, value: string) {
    check(await this.db.from("settings").upsert({ key, value, updated_at: new Date().toISOString() }), "settings");
  }

  async latestRunForDate(date: string) {
    const data = check(
      await this.db.from("generation_runs").select("*").eq("run_date", date).order("started_at", { ascending: false }).limit(1),
      "runs",
    );
    return data?.[0] ? mapRun(data[0]) : null;
  }
  async runsForDate(date: string) {
    const data = check(await this.db.from("generation_runs").select("*").eq("run_date", date).order("started_at"), "runs");
    return (data ?? []).map(mapRun);
  }
  async startRun(date: string) {
    const data = check(await this.db.from("generation_runs").insert({ run_date: date, status: "running" }).select().single(), "runs");
    return mapRun(data);
  }
  async finishRun(id: string, status: GenerationRun["status"], message: string | null) {
    check(
      await this.db.from("generation_runs").update({ status, message, finished_at: new Date().toISOString() }).eq("id", id),
      "runs",
    );
  }
  async listRuns(limit: number) {
    const data = check(await this.db.from("generation_runs").select("*").order("started_at", { ascending: false }).limit(limit), "runs");
    return (data ?? []).map(mapRun);
  }

  async publishCoupons(inputs: Parameters<Repository["publishCoupons"]>[0]) {
    const payload = inputs.map(({ input, contentHash, publishedAt }) => ({
      date: input.date,
      kind: input.kind,
      is_free: input.isFree,
      price_cents: input.priceCents,
      title: input.title,
      summary: input.summary,
      total_odds: roundOdds(productOdds(input.picks)),
      content_hash: contentHash,
      published_at: publishedAt,
      picks: input.picks.map((p) => ({
        fixture_id: p.fixtureId,
        league: p.league,
        home_team: p.homeTeam,
        away_team: p.awayTeam,
        kickoff: p.kickoff,
        market: p.market,
        selection: p.selection,
        odds: p.odds,
        confidence: p.confidence,
        reasoning: p.reasoning,
      })),
    }));
    const ids = check(await this.db.rpc("publish_coupons", { payload }), "publish") as unknown as (string | Row)[];
    const idList = ids.map((x) => (typeof x === "string" ? x : Object.values(x)[0])) as string[];
    const data = check(await this.db.from("coupons").select("*, picks(*)").in("id", idList), "coupons");
    return (data ?? []).map(mapCoupon);
  }

  async getCoupon(id: string) {
    const data = check(await this.db.from("coupons").select("*, picks(*)").eq("id", id).maybeSingle(), "coupons");
    return data ? mapCoupon(data) : null;
  }

  private applyFilters<Q extends { gte: any; lte: any; eq: any; neq: any }>(q: Q, opts: ListCouponsOptions): Q {
    if (opts.from) q = q.gte("date", opts.from);
    if (opts.to) q = q.lte("date", opts.to);
    if (opts.status === "settled") q = q.neq("status", "pending");
    else if (opts.status) q = q.eq("status", opts.status);
    return q;
  }

  async listCoupons(opts: ListCouponsOptions) {
    let q = this.db.from("coupons").select("*, picks(*)");
    q = this.applyFilters(q, opts);
    const off = opts.offset ?? 0;
    const lim = opts.limit ?? 1000;
    const data = check(
      await q.order("date", { ascending: false }).order("kind").order("published_at").range(off, off + lim - 1),
      "coupons",
    );
    return (data ?? []).map(mapCoupon);
  }
  async countCoupons(opts: ListCouponsOptions) {
    let q = this.db.from("coupons").select("id", { count: "exact", head: true });
    q = this.applyFilters(q, opts);
    const res = await q;
    if (res.error) throw new Error(`Baza danych (count): ${res.error.message}`);
    return res.count ?? 0;
  }

  async listPendingPicks() {
    const data = check(await this.db.from("picks").select("*").eq("status", "pending"), "picks");
    return (data ?? []).map(mapPick);
  }
  async settlePick(id: string, status: Pick["status"], scoreHome: number | null, scoreAway: number | null) {
    check(
      await this.db
        .from("picks")
        .update({ status, score_home: scoreHome, score_away: scoreAway, settled_at: new Date().toISOString() })
        .eq("id", id)
        .eq("status", "pending"),
      "settle pick",
    );
  }
  async settleCoupon(id: string, status: Coupon["status"], settledOdds: number | null) {
    check(
      await this.db
        .from("coupons")
        .update({ status, settled_odds: settledOdds, settled_at: new Date().toISOString() })
        .eq("id", id)
        .eq("status", "pending"),
      "settle coupon",
    );
  }

  async getProfile(userId: string) {
    const data = check(await this.db.from("profiles").select("*").eq("id", userId).maybeSingle(), "profiles");
    return data ? mapProfile(data) : null;
  }
  async getProfileByCustomerId(customerId: string) {
    const data = check(await this.db.from("profiles").select("*").eq("stripe_customer_id", customerId).maybeSingle(), "profiles");
    return data ? mapProfile(data) : null;
  }
  async setStripeCustomerId(userId: string, customerId: string) {
    check(await this.db.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId), "profiles");
  }
  async confirmAdult(userId: string) {
    check(
      await this.db.from("profiles").update({ adult_confirmed_at: new Date().toISOString() }).eq("id", userId).is("adult_confirmed_at", null),
      "profiles",
    );
  }
  async countUsers() {
    const res = await this.db.from("profiles").select("id", { count: "exact", head: true });
    if (res.error) throw new Error(res.error.message);
    return res.count ?? 0;
  }

  async upsertSubscription(sub: Subscription) {
    check(
      await this.db.from("subscriptions").upsert({
        stripe_subscription_id: sub.stripeSubscriptionId,
        user_id: sub.userId,
        status: sub.status,
        current_period_end: sub.currentPeriodEnd,
        cancel_at_period_end: sub.cancelAtPeriodEnd,
        updated_at: new Date().toISOString(),
      }),
      "subscriptions",
    );
  }
  async getSubscription(userId: string) {
    const data = check(await this.db.from("subscriptions").select("*").eq("user_id", userId).order("updated_at", { ascending: false }), "subscriptions");
    const subs = (data ?? []).map(mapSub);
    return subs.find((s) => isSubscriptionActive(s, new Date())) ?? subs[0] ?? null;
  }
  private async activeSubs(now: Date) {
    const data = check(
      await this.db.from("subscriptions").select("*, profiles(email)").in("status", ["active", "trialing"]),
      "subscriptions",
    );
    return (data ?? []).filter((r: Row) => isSubscriptionActive(mapSub(r), now));
  }
  async countActiveSubscribers(now: Date) {
    return new Set((await this.activeSubs(now)).map((r: Row) => r.user_id)).size;
  }
  async listActiveSubscriberEmails(now: Date) {
    return [...new Set((await this.activeSubs(now)).map((r: Row) => r.profiles?.email).filter(Boolean))] as string[];
  }
  async grantCouponAccess(userId: string, couponId: string, ref: string) {
    check(
      await this.db
        .from("coupon_access")
        .upsert({ user_id: userId, coupon_id: couponId, ledger_external_id: ref }, { onConflict: "user_id,coupon_id", ignoreDuplicates: true }),
      "access",
    );
  }
  async hasCouponAccess(userId: string, couponId: string) {
    const data = check(
      await this.db.from("coupon_access").select("coupon_id").eq("user_id", userId).eq("coupon_id", couponId).maybeSingle(),
      "access",
    );
    return !!data;
  }
  async listAccessibleCouponIds(userId: string) {
    const data = check(await this.db.from("coupon_access").select("coupon_id").eq("user_id", userId), "access");
    return (data ?? []).map((r: Row) => r.coupon_id as string);
  }
  async recordConsent(userId: string, kind: string, text: string, reference: string) {
    check(await this.db.from("consents").insert({ user_id: userId, kind, text, reference }), "consents");
  }

  async upsertLedgerEntry(entry: Omit<LedgerEntry, "id">) {
    const existing = check(await this.db.from("ledger").select("id").eq("external_id", entry.externalId).maybeSingle(), "ledger");
    const row = {
      external_id: entry.externalId,
      user_id: entry.userId,
      kind: entry.kind,
      amount_cents: entry.amountCents,
      description: entry.description,
      occurred_at: entry.occurredAt,
    };
    if (existing) {
      check(await this.db.from("ledger").update(row).eq("external_id", entry.externalId), "ledger");
      return { created: false };
    }
    const res = await this.db.from("ledger").insert(row);
    if (res.error) {
      // Równoległe dostarczenie tego samego zdarzenia — wpis już istnieje.
      if (res.error.code === "23505") return { created: false };
      throw new Error(`Baza danych (ledger): ${res.error.message}`);
    }
    return { created: true };
  }
  async listLedger(fromIso?: string, toIso?: string) {
    let q = this.db.from("ledger").select("*");
    if (fromIso) q = q.gte("occurred_at", fromIso);
    if (toIso) q = q.lt("occurred_at", toIso);
    const data = check(await q.order("occurred_at"), "ledger");
    return (data ?? []).map(
      (r: Row): LedgerEntry => ({
        id: r.id,
        externalId: r.external_id,
        userId: r.user_id,
        kind: r.kind,
        amountCents: r.amount_cents,
        description: r.description,
        occurredAt: new Date(r.occurred_at).toISOString(),
      }),
    );
  }
}
