import { aggregateOdds, type RawBookmaker } from "../odds";
import type { FixtureResult } from "../settlement";
import type { CandidateFixture, SportsDataProvider, TeamStanding } from "./types";

// Klient API-Football (api-sports.io). Darmowy plan: 100 zapytań/dzień, 10/minutę —
// dlatego zapytania są wykonywane po kolei z odstępem.

const BASE_URL = "https://v3.football.api-sports.io";
const CUP_LEAGUES = new Set([2, 3, 848]); // tam tabela jest mniej przydatna

type Fetch = typeof fetch;

export class ApiFootballError extends Error {}

interface ApiFixture {
  fixture: { id: number; date: string; status: { short: string } };
  league: { id: number; name: string; country: string; season: number };
  teams: { home: { id: number; name: string }; away: { id: number; name: string } };
  goals: { home: number | null; away: number | null };
  score: { fulltime: { home: number | null; away: number | null } };
}

interface ApiStandingRow {
  rank: number;
  points: number;
  form: string | null;
  team: { id: number; name: string };
  all: { played: number; goals: { for: number; against: number } };
  home: { win: number; draw: number; lose: number };
  away: { win: number; draw: number; lose: number };
}

export class ApiFootballProvider implements SportsDataProvider {
  private lastCall = 0;
  public requestsUsed = 0;

  constructor(
    private readonly apiKey: string,
    private readonly leagueIds: number[],
    private readonly minIntervalMs = 6500,
    private readonly fetchImpl: Fetch = fetch,
    private readonly sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  ) {}

  private async get<T>(path: string, params: Record<string, string | number>): Promise<{ response: T; paging?: { current: number; total: number } }> {
    const wait = this.lastCall + this.minIntervalMs - Date.now();
    if (this.lastCall && wait > 0) await this.sleep(wait);
    this.lastCall = Date.now();

    const url = new URL(BASE_URL + path);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    const res = await this.fetchImpl(url, { headers: { "x-apisports-key": this.apiKey } });
    this.requestsUsed++;
    if (!res.ok) throw new ApiFootballError(`API-Football ${path}: HTTP ${res.status}`);
    const body = (await res.json()) as {
      response: T;
      errors: unknown;
      paging?: { current: number; total: number };
    };
    const errors = body.errors;
    const hasErrors = Array.isArray(errors) ? errors.length > 0 : errors && Object.keys(errors).length > 0;
    if (hasErrors) {
      throw new ApiFootballError(`API-Football ${path}: ${JSON.stringify(errors)}`);
    }
    return { response: body.response, paging: body.paging };
  }

  async getCandidates(date: string, now: Date): Promise<CandidateFixture[]> {
    const { response: all } = await this.get<ApiFixture[]>("/fixtures", { date, timezone: "Europe/Warsaw" });
    const minKickoff = now.getTime() + 30 * 60_000;
    const fixtures = all.filter(
      (f) =>
        this.leagueIds.includes(f.league.id) &&
        f.fixture.status.short === "NS" &&
        new Date(f.fixture.date).getTime() > minKickoff,
    );
    if (fixtures.length === 0) return [];

    const leagues = new Map<number, number>(); // id -> sezon
    for (const f of fixtures) leagues.set(f.league.id, f.league.season);

    // Kursy (per liga, z obsługą stronicowania).
    const oddsByFixture = new Map<number, RawBookmaker[]>();
    for (const [league, season] of leagues) {
      let page = 1;
      let total = 1;
      do {
        const { response, paging } = await this.get<{ fixture: { id: number }; bookmakers: RawBookmaker[] }[]>(
          "/odds",
          { league, season, date, timezone: "Europe/Warsaw", page },
        );
        for (const r of response) oddsByFixture.set(r.fixture.id, r.bookmakers);
        total = Math.min(paging?.total ?? 1, 3);
        page++;
      } while (page <= total);
    }

    // Tabele (forma, punkty, bilans u siebie/na wyjeździe).
    const standings = new Map<number, TeamStanding>();
    for (const [league, season] of leagues) {
      if (CUP_LEAGUES.has(league)) continue;
      try {
        const { response } = await this.get<{ league: { standings: ApiStandingRow[][] } }[]>("/standings", {
          league,
          season,
        });
        for (const group of response[0]?.league.standings ?? []) {
          for (const row of group) {
            standings.set(row.team.id, {
              rank: row.rank,
              points: row.points,
              played: row.all.played,
              form: row.form,
              goalsFor: row.all.goals.for,
              goalsAgainst: row.all.goals.against,
              homeRecord: `${row.home.win}-${row.home.draw}-${row.home.lose}`,
              awayRecord: `${row.away.win}-${row.away.draw}-${row.away.lose}`,
            });
          }
        }
      } catch (e) {
        console.warn(`Pominięto tabelę ligi ${league}:`, (e as Error).message);
      }
    }

    // Kontuzje i zawieszenia (jedno zapytanie na cały dzień).
    const injuries = new Map<number, CandidateFixture["injuries"]>();
    try {
      const { response } = await this.get<
        { player: { name: string; reason: string | null }; team: { id: number }; fixture: { id: number } }[]
      >("/injuries", { date, timezone: "Europe/Warsaw" });
      const teamSide = new Map<string, "home" | "away">();
      for (const f of fixtures) {
        teamSide.set(`${f.fixture.id}:${f.teams.home.id}`, "home");
        teamSide.set(`${f.fixture.id}:${f.teams.away.id}`, "away");
      }
      for (const r of response) {
        const side = teamSide.get(`${r.fixture.id}:${r.team.id}`);
        if (!side) continue;
        const list = injuries.get(r.fixture.id) ?? [];
        list.push({ team: side, player: r.player.name, reason: r.player.reason ?? "brak informacji" });
        injuries.set(r.fixture.id, list);
      }
    } catch (e) {
      console.warn("Pominięto kontuzje:", (e as Error).message);
    }

    return fixtures
      .map((f): CandidateFixture => ({
        fixtureId: f.fixture.id,
        league: f.league.name,
        country: f.league.country,
        kickoff: new Date(f.fixture.date).toISOString(),
        homeTeam: f.teams.home.name,
        awayTeam: f.teams.away.name,
        homeStanding: standings.get(f.teams.home.id) ?? null,
        awayStanding: standings.get(f.teams.away.id) ?? null,
        injuries: injuries.get(f.fixture.id) ?? [],
        odds: aggregateOdds(oddsByFixture.get(f.fixture.id) ?? []),
      }))
      .filter((c) => c.odds.length > 0);
  }

  async getResults(fixtureIds: number[]): Promise<FixtureResult[]> {
    const out: FixtureResult[] = [];
    for (let i = 0; i < fixtureIds.length; i += 20) {
      const ids = fixtureIds.slice(i, i + 20).join("-");
      const { response } = await this.get<ApiFixture[]>("/fixtures", { ids });
      for (const f of response) {
        out.push({
          fixtureId: f.fixture.id,
          statusShort: f.fixture.status.short,
          kickoff: new Date(f.fixture.date).toISOString(),
          fulltimeHome: f.score.fulltime.home ?? (f.fixture.status.short === "FT" ? f.goals.home : null),
          fulltimeAway: f.score.fulltime.away ?? (f.fixture.status.short === "FT" ? f.goals.away : null),
        });
      }
    }
    return out;
  }
}
