import { describe, expect, it } from "vitest";
import { evaluateSelection, settleCoupon, settlePick, type FixtureResult } from "@/lib/settlement";
import { MemoryRepository } from "@/lib/db/memoryRepo";
import { runSettlement } from "@/lib/jobs/settle";
import type { CouponInput, PickInput } from "@/lib/types";
import type { SportsDataProvider } from "@/lib/sports/types";

const result = (h: number | null, a: number | null, status = "FT", kickoff = "2026-10-20T18:00:00Z"): FixtureResult => ({
  fixtureId: 1,
  statusShort: status,
  kickoff,
  fulltimeHome: h,
  fulltimeAway: a,
});

describe("ocena zakładów", () => {
  it.each([
    ["1X2", "home", 2, 1, "won"],
    ["1X2", "home", 1, 1, "lost"],
    ["1X2", "draw", 0, 0, "won"],
    ["1X2", "away", 0, 3, "won"],
    ["DC", "1X", 1, 1, "won"],
    ["DC", "1X", 0, 1, "lost"],
    ["DC", "X2", 2, 2, "won"],
    ["DC", "12", 1, 1, "lost"],
    ["OU", "over_2.5", 2, 1, "won"],
    ["OU", "over_2.5", 1, 1, "lost"],
    ["OU", "under_1.5", 1, 0, "won"],
    ["OU", "under_3.5", 2, 2, "lost"],
    ["BTTS", "yes", 1, 1, "won"],
    ["BTTS", "yes", 2, 0, "lost"],
    ["BTTS", "no", 0, 0, "won"],
  ] as const)("%s %s przy %i:%i → %s", (market, sel, h, a, expected) => {
    expect(evaluateSelection(market, sel, h, a)).toBe(expected);
  });

  it("odrzuca nieznany rynek", () => {
    expect(() => evaluateSelection("XYZ" as never, "a", 1, 0)).toThrow();
  });
});

describe("rozliczanie typu", () => {
  it("mecz w trakcie → brak rozliczenia", () => {
    expect(settlePick("1X2", "home", result(1, 0, "2H"))).toBeNull();
    expect(settlePick("1X2", "home", result(null, null, "NS"))).toBeNull();
  });

  it("wynik po dogrywce liczy się po 90 minutach (score.fulltime)", () => {
    expect(settlePick("1X2", "draw", result(1, 1, "AET"))?.status).toBe("won");
  });

  it("odwołany lub przerwany mecz → zwrot", () => {
    expect(settlePick("1X2", "home", result(null, null, "CANC"))?.status).toBe("void");
    expect(settlePick("OU", "over_2.5", result(1, 0, "ABD"))?.status).toBe("void");
  });

  it("przełożony mecz → zwrot dopiero po 48 godzinach", () => {
    const r = result(null, null, "PST", "2026-10-20T18:00:00Z");
    expect(settlePick("1X2", "home", r, new Date("2026-10-21T18:00:00Z"))).toBeNull();
    expect(settlePick("1X2", "home", r, new Date("2026-10-22T18:00:01Z"))?.status).toBe("void");
  });
});

describe("rozliczanie kuponu", () => {
  it("wszystkie trafione → wygrany z pełnym kursem", () => {
    expect(settleCoupon([{ status: "won", odds: 1.5 }, { status: "won", odds: 1.4 }])).toEqual({ status: "won", settledOdds: 2.1 });
  });
  it("jeden przegrany → przegrany", () => {
    expect(settleCoupon([{ status: "won", odds: 1.5 }, { status: "lost", odds: 1.4 }])?.status).toBe("lost");
  });
  it("zwrot na jednym zdarzeniu usuwa jego kurs", () => {
    expect(settleCoupon([{ status: "won", odds: 1.5 }, { status: "void", odds: 1.4 }])).toEqual({ status: "won", settledOdds: 1.5 });
  });
  it("wszystkie zwroty → zwrot", () => {
    expect(settleCoupon([{ status: "void", odds: 1.5 }])).toEqual({ status: "void", settledOdds: null });
  });
  it("czeka, dopóki jakiś typ jest w grze", () => {
    expect(settleCoupon([{ status: "won", odds: 1.5 }, { status: "pending", odds: 1.4 }])).toBeNull();
  });
});

function pick(fixtureId: number, market: PickInput["market"], selection: string, odds: number): PickInput {
  return {
    fixtureId,
    league: "Ekstraklasa",
    homeTeam: `A${fixtureId}`,
    awayTeam: `B${fixtureId}`,
    kickoff: "2026-10-22T18:00:00Z",
    market,
    selection,
    odds,
    confidence: 3,
    reasoning: "Uzasadnienie testowe oparte na danych.",
  };
}

describe("zadanie rozliczania", () => {
  it("rozlicza typy i kupony po meczach, nie dotyka meczów w trakcie", async () => {
    const repo = new MemoryRepository();
    const input: CouponInput = {
      date: "2026-10-22",
      kind: "coupon_of_day",
      isFree: false,
      priceCents: 900,
      title: "Kupon",
      summary: "",
      picks: [pick(1, "1X2", "home", 1.5), pick(2, "OU", "over_2.5", 1.4)],
    };
    const single: CouponInput = { ...input, kind: "single", picks: [pick(3, "BTTS", "yes", 1.8)] };
    await repo.publishCoupons([input, single].map((i) => ({ input: i, contentHash: "h", publishedAt: "2026-10-22T07:00:00Z" })));

    const provider: SportsDataProvider = {
      getCandidates: async () => [],
      getResults: async (ids) =>
        ids.map((id) =>
          id === 3
            ? { fixtureId: 3, statusShort: "2H", kickoff: "2026-10-22T18:00:00Z", fulltimeHome: null, fulltimeAway: null }
            : { fixtureId: id, statusShort: "FT", kickoff: "2026-10-22T18:00:00Z", fulltimeHome: 2, fulltimeAway: 1 },
        ),
    };
    const res = await runSettlement({ repo, provider, now: () => new Date("2026-10-22T21:00:00Z") });
    expect(res).toEqual({ checkedPicks: 3, settledPicks: 2, settledCoupons: 1 });

    const [cod, s] = repo.coupons;
    expect(cod.status).toBe("won");
    expect(cod.settledOdds).toBe(2.1);
    expect(cod.picks.map((p) => [p.status, p.scoreHome, p.scoreAway])).toEqual([
      ["won", 2, 1],
      ["won", 2, 1],
    ]);
    expect(s.status).toBe("pending");

    // Ponowne uruchomienie nie zmienia rozliczonych typów.
    const again = await runSettlement({ repo, provider, now: () => new Date("2026-10-22T21:30:00Z") });
    expect(again.settledCoupons).toBe(0);
  });

  it("nie sprawdza meczów, które dopiero się zaczęły", async () => {
    const repo = new MemoryRepository();
    const input: CouponInput = { date: "2026-10-22", kind: "single", isFree: true, priceCents: 0, title: "", summary: "", picks: [pick(9, "1X2", "home", 2)] };
    await repo.publishCoupons([{ input, contentHash: "h", publishedAt: "x" }]);
    let called = false;
    const provider: SportsDataProvider = { getCandidates: async () => [], getResults: async () => ((called = true), []) };
    await runSettlement({ repo, provider, now: () => new Date("2026-10-22T19:00:00Z") });
    expect(called).toBe(false);
  });

  it("rozliczonego typu nie można zmienić (repozytorium)", async () => {
    const repo = new MemoryRepository();
    const input: CouponInput = { date: "2026-10-22", kind: "single", isFree: true, priceCents: 0, title: "", summary: "", picks: [pick(9, "1X2", "home", 2)] };
    const [c] = await repo.publishCoupons([{ input, contentHash: "h", publishedAt: "x" }]);
    await repo.settlePick(c.picks[0].id, "lost", 0, 1);
    await expect(repo.settlePick(c.picks[0].id, "won", 1, 0)).rejects.toThrow();
  });
});
