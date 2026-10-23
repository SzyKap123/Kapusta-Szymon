import { describe, expect, it } from "vitest";
import { ApiFootballError, ApiFootballProvider } from "@/lib/sports/apiFootball";

function fakeFetch(routes: Record<string, unknown>) {
  const calls: string[] = [];
  const fn = (async (input: URL | string) => {
    const url = new URL(String(input));
    calls.push(url.pathname + url.search);
    const body = routes[url.pathname] ?? { response: [], errors: [] };
    return new Response(JSON.stringify(typeof body === "function" ? (body as (u: URL) => unknown)(url) : body), { status: 200 });
  }) as typeof fetch;
  return { fn, calls };
}

const fixture = (id: number, league: number, date = "2026-10-23T18:00:00+02:00") => ({
  fixture: { id, date, status: { short: "NS" } },
  league: { id: league, name: "Ekstraklasa", country: "Poland", season: 2026 },
  teams: { home: { id: id * 10, name: `H${id}` }, away: { id: id * 10 + 1, name: `A${id}` } },
  goals: { home: null, away: null },
  score: { fulltime: { home: null, away: null } },
});

describe("API-Football", () => {
  it("łączy terminarz, kursy, tabelę i kontuzje; pomija inne ligi i mecze bez kursów", async () => {
    const { fn, calls } = fakeFetch({
      "/fixtures": { response: [fixture(1, 106), fixture(2, 106), fixture(3, 999)], errors: [] },
      "/odds": {
        response: [{ fixture: { id: 1 }, bookmakers: [{ name: "X", bets: [{ name: "Match Winner", values: [{ value: "Home", odd: "1.80" }] }] }] }],
        errors: [],
        paging: { current: 1, total: 1 },
      },
      "/standings": {
        response: [{ league: { standings: [[{ rank: 1, points: 20, form: "WWWDL", team: { id: 10 }, all: { played: 9, goals: { for: 18, against: 6 } }, home: { win: 4, draw: 1, lose: 0 }, away: { win: 2, draw: 1, lose: 1 } }]] } }],
        errors: [],
      },
      "/injuries": { response: [{ player: { name: "Kowalski", reason: "Kontuzja kolana" }, team: { id: 11 }, fixture: { id: 1 } }], errors: [] },
    });
    const p = new ApiFootballProvider("key", [106], 0, fn);
    const res = await p.getCandidates("2026-10-23", new Date("2026-10-23T07:00:00Z"));
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({
      fixtureId: 1,
      homeStanding: { rank: 1, form: "WWWDL", homeRecord: "4-1-0" },
      injuries: [{ team: "away", player: "Kowalski" }],
      odds: [{ selection: "home", odds: 1.8 }],
    });
    expect(calls.some((c) => c.startsWith("/odds") && c.includes("league=106"))).toBe(true);
    expect(JSON.stringify(res)).not.toContain('"X"');
  });

  it("zgłasza czytelny błąd, gdy plan nie obejmuje sezonu", async () => {
    const { fn } = fakeFetch({ "/fixtures": { response: [], errors: { plan: "Free plans do not have access to this season" } } });
    const p = new ApiFootballProvider("key", [106], 0, fn);
    await expect(p.getCandidates("2026-10-23", new Date())).rejects.toBeInstanceOf(ApiFootballError);
  });

  it("pobiera wyniki partiami po 20 meczów", async () => {
    const { fn, calls } = fakeFetch({
      "/fixtures": (u: URL) => ({
        response: (u.searchParams.get("ids") ?? "").split("-").map((id) => ({ ...fixture(Number(id), 106), fixture: { id: Number(id), date: "2026-10-22T18:00:00Z", status: { short: "FT" } }, score: { fulltime: { home: 2, away: 0 } } })),
        errors: [],
      }),
    });
    const p = new ApiFootballProvider("key", [106], 0, fn);
    const ids = Array.from({ length: 25 }, (_, i) => i + 1);
    const res = await p.getResults(ids);
    expect(res).toHaveLength(25);
    expect(calls).toHaveLength(2);
    expect(res[0]).toMatchObject({ statusShort: "FT", fulltimeHome: 2, fulltimeAway: 0 });
  });
});
