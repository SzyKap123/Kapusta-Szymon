import { describe, expect, it } from "vitest";
import type { TipGenerator } from "@/lib/ai/claude";
import type { AiTips } from "@/lib/ai/schema";
import { buildCoupons } from "@/lib/ai/validate";
import { buildUserPrompt } from "@/lib/ai/prompt";
import { checkText } from "@/lib/compliance";
import { MemoryRepository } from "@/lib/db/memoryRepo";
import { ConsoleMailer } from "@/lib/email/resend";
import { runGeneration, PAUSE_SETTING, type JobDeps } from "@/lib/jobs/generate";
import { runWatchdog } from "@/lib/jobs/watchdog";
import { aggregateOdds, approxOdds } from "@/lib/odds";
import { couponContentHash } from "@/lib/hash";
import type { CandidateFixture, SportsDataProvider } from "@/lib/sports/types";

function candidate(id: number, odds: Partial<Record<string, number>> = {}): CandidateFixture {
  const base = { home: 1.6, draw: 3.8, away: 5.0, "1X": 1.15, "over_2.5": 1.9, "under_2.5": 1.9, yes: 1.75, no: 2.0, ...odds };
  const market = (sel: string) => (["home", "draw", "away"].includes(sel) ? "1X2" : sel === "1X" ? "DC" : sel.includes("_") ? "OU" : "BTTS");
  return {
    fixtureId: id,
    league: "Ekstraklasa",
    country: "Poland",
    kickoff: "2026-10-23T18:00:00Z",
    homeTeam: `Gospodarz ${id}`,
    awayTeam: `Gość ${id}`,
    homeStanding: null,
    awayStanding: null,
    injuries: [],
    odds: Object.entries(base).map(([selection, o]) => ({ market: market(selection), selection, label: selection, odds: o!, sources: 5 })),
  };
}

const CANDIDATES = [1, 2, 3, 4, 5, 6, 7].map((i) => candidate(i));
const REASON = "Gospodarze wygrali cztery z pięciu ostatnich meczów u siebie.";

const GOOD: AiTips = {
  coupon_of_day: {
    summary: "Dwa mecze z wyraźną przewagą formy gospodarzy.",
    picks: [
      { fixture_id: 1, market: "1X2", selection: "home", confidence: 3, reasoning: REASON },
      { fixture_id: 2, market: "DC", selection: "1X", confidence: 4, reasoning: REASON }, // 1.6 × 1.15 = 1.84
    ],
  },
  singles: [
    { fixture_id: 3, market: "OU", selection: "over_2.5", confidence: 3, reasoning: REASON },
    { fixture_id: 4, market: "BTTS", selection: "yes", confidence: 2, reasoning: REASON },
    { fixture_id: 5, market: "1X2", selection: "home", confidence: 4, reasoning: REASON },
  ],
  free_single_index: 1,
};

describe("kursy", () => {
  it("liczy medianę z wielu źródeł i zaokrągla do 0,05, bez nazw bukmacherów", () => {
    const res = aggregateOdds([
      { name: "Bukmacher A", bets: [{ name: "Match Winner", values: [{ value: "Home", odd: "2.00" }, { value: "Away", odd: "3.5" }] }] },
      { name: "Bukmacher B", bets: [{ name: "Match Winner", values: [{ value: "Home", odd: "2.10" }] }] },
      { name: "Bukmacher C", bets: [{ name: "Match Winner", values: [{ value: "Home", odd: "2.07" }] }] },
      { name: "X", bets: [{ name: "Nieznany zakład", values: [{ value: "Home", odd: "9" }] }] },
    ]);
    expect(res.find((o) => o.selection === "home")).toMatchObject({ odds: 2.05, sources: 3 });
    expect(JSON.stringify(res)).not.toMatch(/Bukmacher/);
    expect(approxOdds(1.83)).toBe(1.85);
  });
});

describe("filtr treści", () => {
  it.each(["To pewniak dnia", "Gwarantowana wygrana", "Zarobisz dziś", "Kurs w Fortuna jest wyższy", "zagraj na bet365", "100% pewne", "www.strona.pl"])(
    "blokuje: %s",
    (t) => expect(checkText(t).length).toBeGreaterThan(0),
  );
  it("przepuszcza rzeczowe uzasadnienie", () => {
    expect(checkText(REASON)).toEqual([]);
  });
});

describe("walidacja odpowiedzi AI", () => {
  it("buduje kupon dnia i typy pojedyncze z kursami z danych rynkowych", () => {
    const res = buildCoupons(GOOD, CANDIDATES, { date: "2026-10-23", couponPriceCents: 900 });
    expect(res.errors).toEqual([]);
    expect(res.coupons).toHaveLength(4);
    const [cod, ...singles] = res.coupons;
    expect(cod.kind).toBe("coupon_of_day");
    expect(cod.title).toBe("Kupon dnia — kurs ok. 1.84");
    expect(cod.picks.map((p) => p.odds)).toEqual([1.6, 1.15]);
    expect(singles.filter((s) => s.isFree)).toHaveLength(1);
    expect(singles.find((s) => s.isFree)?.picks[0].fixtureId).toBe(4);
  });

  it("odrzuca mecz spoza danych, zbyt wysoki kurs kuponu i zakazane słowa", () => {
    const bad: AiTips = {
      ...GOOD,
      coupon_of_day: {
        summary: "Pewniak dnia",
        picks: [
          { fixture_id: 99, market: "1X2", selection: "home", confidence: 3, reasoning: REASON },
          { fixture_id: 1, market: "1X2", selection: "away", confidence: 3, reasoning: REASON },
          { fixture_id: 2, market: "1X2", selection: "away", confidence: 3, reasoning: REASON },
        ],
      },
    };
    const res = buildCoupons(bad, CANDIDATES, { date: "2026-10-23", couponPriceCents: 900 });
    expect(res.coupons).toEqual([]);
    expect(res.errors.join("\n")).toMatch(/99/);
    expect(res.errors.join("\n")).toMatch(/Łączny kurs/);
    expect(res.errors.join("\n")).toMatch(/Pewniak/);
  });

  it("odrzuca pojedyncze typy z meczów kuponu dnia i duplikaty, pewność obcina do 1–5", () => {
    const res = buildCoupons(
      {
        ...GOOD,
        singles: [
          { fixture_id: 1, market: "OU", selection: "over_2.5", confidence: 3, reasoning: REASON },
          { fixture_id: 3, market: "OU", selection: "over_2.5", confidence: 9, reasoning: REASON },
          { fixture_id: 3, market: "BTTS", selection: "yes", confidence: 3, reasoning: REASON },
        ],
        free_single_index: 0,
      },
      CANDIDATES,
      { date: "2026-10-23", couponPriceCents: 900 },
    );
    expect(res.errors).toEqual([]);
    expect(res.warnings).toHaveLength(2);
    const singles = res.coupons.filter((c) => c.kind === "single");
    expect(singles).toHaveLength(1);
    expect(singles[0].picks[0].confidence).toBe(5);
    expect(singles[0].isFree).toBe(true);
  });

  it("prompt zawiera dane meczu i informację zwrotną przy ponowieniu", () => {
    const p = buildUserPrompt("2026-10-23", [candidate(1)], "Błąd X");
    expect(p).toContain("fixture_id 1");
    expect(p).toContain("kurs ok. 1.60");
    expect(p).toContain("Błąd X");
  });
});

class FakeAi implements TipGenerator {
  calls: (string | undefined)[] = [];
  constructor(private readonly responses: (AiTips | Error)[]) {}
  async generate(_date: string, _c: CandidateFixture[], feedback?: string) {
    this.calls.push(feedback);
    const r = this.responses[Math.min(this.calls.length - 1, this.responses.length - 1)];
    if (r instanceof Error) throw r;
    return r;
  }
}

function deps(overrides: Partial<JobDeps> = {}): JobDeps & { repo: MemoryRepository; mailer: ConsoleMailer } {
  const provider: SportsDataProvider = { getCandidates: async () => CANDIDATES, getResults: async () => [] };
  return {
    repo: new MemoryRepository(),
    provider,
    ai: new FakeAi([GOOD]),
    mailer: new ConsoleMailer(),
    siteName: "Typy AI",
    siteUrl: "https://example.pl",
    adminEmails: ["admin@example.pl"],
    couponPriceCents: 900,
    notifyDailyLimit: 90,
    now: () => new Date("2026-10-23T07:05:00Z"), // 9:05 w Polsce (czas letni)
    ...overrides,
  } as JobDeps & { repo: MemoryRepository; mailer: ConsoleMailer };
}

describe("codzienne generowanie", () => {
  it("publikuje typy, zapisuje odcisk treści i powiadamia subskrybentów", async () => {
    const d = deps();
    d.repo.profiles.push({ id: "u1", email: "sub@example.pl", adultConfirmedAt: "x", termsAcceptedAt: "x", stripeCustomerId: null, createdAt: "x" });
    d.repo.subscriptions.push({ userId: "u1", stripeSubscriptionId: "s1", status: "active", currentPeriodEnd: "2026-11-20T00:00:00Z", cancelAtPeriodEnd: false });

    const res = await runGeneration(d);
    expect(res).toMatchObject({ outcome: "published", coupons: 4 });
    expect(d.repo.coupons).toHaveLength(4);
    expect(d.repo.coupons.every((c) => c.date === "2026-10-23" && c.contentHash.length === 64)).toBe(true);
    expect(d.repo.runs[0].status).toBe("success");
    expect(d.mailer.sent.map((m) => m.to)).toEqual(["sub@example.pl"]);
    expect(d.mailer.sent[0].html).toContain("nie gwarantują wygranej");
  });

  it("nie generuje przed 9:00 ani drugi raz tego samego dnia", async () => {
    const early = deps({ now: () => new Date("2026-10-23T06:30:00Z") });
    expect((await runGeneration(early)).outcome).toBe("too_early");

    const d = deps();
    await runGeneration(d);
    expect((await runGeneration(d)).outcome).toBe("already_done");
    expect(d.repo.coupons).toHaveLength(4);
  });

  it("uwzględnia czas zimowy: 8:05 UTC w listopadzie to 9:05 w Polsce", async () => {
    expect((await runGeneration(deps({ now: () => new Date("2026-11-10T07:30:00Z") }))).outcome).toBe("too_early");
    expect((await runGeneration(deps({ now: () => new Date("2026-11-10T08:05:00Z") }))).outcome).toBe("published");
  });

  it("respektuje wstrzymanie publikacji", async () => {
    const d = deps();
    await d.repo.setSetting(PAUSE_SETTING, "true");
    expect((await runGeneration(d)).outcome).toBe("paused");
    expect(d.repo.coupons).toHaveLength(0);
  });

  it("przy błędnej odpowiedzi ponawia z listą błędów", async () => {
    const bad: AiTips = { ...GOOD, coupon_of_day: { ...GOOD.coupon_of_day, picks: [GOOD.coupon_of_day.picks[0]] } };
    const ai = new FakeAi([bad, GOOD]);
    const d = deps({ ai });
    expect((await runGeneration(d)).outcome).toBe("published");
    expect(ai.calls[0]).toBeUndefined();
    expect(ai.calls[1]).toMatch(/2–4 zdarzenia/);
  });

  it("gdy generowanie się nie uda — zapisuje błąd i wysyła e-mail do administratora", async () => {
    const d = deps({ ai: new FakeAi([new Error("API niedostępne")]) });
    const res = await runGeneration(d);
    expect(res).toMatchObject({ outcome: "failed" });
    expect(d.repo.runs[0]).toMatchObject({ status: "failed" });
    expect(d.mailer.sent[0].to).toBe("admin@example.pl");
    expect(d.mailer.sent[0].subject).toMatch(/Nie udało się/);
    expect(d.repo.coupons).toHaveLength(0);
  });

  it("po 3 nieudanych próbach przestaje próbować do następnego dnia", async () => {
    const d = deps({ ai: new FakeAi([new Error("x")]) });
    for (let i = 0; i < 3; i++) await runGeneration(d);
    expect((await runGeneration(d)).outcome).toBe("attempts_exhausted");
  });

  it("za mało meczów → dzień bez typów, bez alarmu", async () => {
    const d = deps({ provider: { getCandidates: async () => CANDIDATES.slice(0, 2), getResults: async () => [] } });
    expect((await runGeneration(d)).outcome).toBe("no_matches");
    expect(d.mailer.sent).toHaveLength(0);
  });
});

describe("strażnik", () => {
  it("wysyła alert raz, gdy o 10:00 brak udanego generowania", async () => {
    const d = deps();
    const w = { repo: d.repo, mailer: d.mailer, adminEmails: d.adminEmails, siteName: "Typy AI", now: () => new Date("2026-10-23T08:45:00Z") };
    expect(await runWatchdog(w)).toBe("alerted");
    expect(await runWatchdog(w)).toBe("already_alerted");
    expect(d.mailer.sent).toHaveLength(1);
  });

  it("nie alarmuje, gdy typy zostały opublikowane", async () => {
    const d = deps();
    await runGeneration(d);
    const sentBefore = d.mailer.sent.length;
    expect(await runWatchdog({ repo: d.repo, mailer: d.mailer, adminEmails: d.adminEmails, siteName: "x", now: () => new Date("2026-10-23T08:45:00Z") })).toBe("ok");
    expect(d.mailer.sent.length).toBe(sentBefore);
  });
});

describe("odcisk treści", () => {
  it("zmienia się przy każdej zmianie typu", () => {
    const res = buildCoupons(GOOD, CANDIDATES, { date: "2026-10-23", couponPriceCents: 900 });
    const c = res.coupons[0];
    const h1 = couponContentHash(c, "2026-10-23T07:00:00Z");
    const h2 = couponContentHash({ ...c, picks: [{ ...c.picks[0], selection: "away" }, c.picks[1]] }, "2026-10-23T07:00:00Z");
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
    expect(h1).not.toBe(h2);
  });
});
