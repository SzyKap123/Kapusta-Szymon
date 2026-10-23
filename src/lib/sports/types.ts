import type { FixtureResult } from "../settlement";

export interface TeamStanding {
  rank: number;
  points: number;
  played: number;
  form: string | null;
  goalsFor: number;
  goalsAgainst: number;
  homeRecord: string; // "W-R-P"
  awayRecord: string;
}

export interface MarketOdds {
  market: string;
  selection: string;
  label: string;
  odds: number; // mediana z wielu źródeł, zaokrąglona
  sources: number; // liczba źródeł (bez nazw)
}

export interface CandidateFixture {
  fixtureId: number;
  league: string;
  country: string;
  kickoff: string; // ISO UTC
  homeTeam: string;
  awayTeam: string;
  homeStanding: TeamStanding | null;
  awayStanding: TeamStanding | null;
  injuries: { team: "home" | "away"; player: string; reason: string }[];
  odds: MarketOdds[];
}

export interface SportsDataProvider {
  /** Mecze danego dnia (czas polski) z kursami, formą i kontuzjami. */
  getCandidates(date: string, now: Date): Promise<CandidateFixture[]>;
  /** Wyniki wskazanych meczów. */
  getResults(fixtureIds: number[]): Promise<FixtureResult[]>;
}
