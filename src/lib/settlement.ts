import type { MarketCode, PickStatus } from "./types";

// Statusy meczu w API-Football.
const FINISHED = new Set(["FT", "AET", "PEN"]);
const VOID_NOW = new Set(["CANC", "ABD", "AWD", "WO"]);
const POSTPONED = new Set(["PST", "TBD", "SUSP", "INT"]);

/** Po ilu godzinach od planowanego startu przełożony mecz uznajemy za zwrot. */
export const POSTPONED_VOID_AFTER_HOURS = 48;

export interface FixtureResult {
  fixtureId: number;
  statusShort: string;
  kickoff: string;
  /** Wynik po regulaminowym czasie gry (90 min + doliczony). */
  fulltimeHome: number | null;
  fulltimeAway: number | null;
}

export interface PickOutcome {
  status: Exclude<PickStatus, "pending">;
  scoreHome: number | null;
  scoreAway: number | null;
}

/** Ocena pojedynczego zakładu na podstawie wyniku. */
export function evaluateSelection(
  market: MarketCode,
  selection: string,
  home: number,
  away: number,
): "won" | "lost" {
  const total = home + away;
  let won: boolean;
  switch (market) {
    case "1X2":
      won =
        (selection === "home" && home > away) ||
        (selection === "draw" && home === away) ||
        (selection === "away" && away > home);
      break;
    case "DC":
      won =
        (selection === "1X" && home >= away) ||
        (selection === "X2" && away >= home) ||
        (selection === "12" && home !== away);
      break;
    case "OU": {
      const [side, lineStr] = selection.split("_");
      const line = Number(lineStr);
      if (!Number.isFinite(line)) throw new Error(`Nieznana linia: ${selection}`);
      won = side === "over" ? total > line : total < line;
      break;
    }
    case "BTTS": {
      const both = home > 0 && away > 0;
      won = selection === "yes" ? both : !both;
      break;
    }
    default:
      throw new Error(`Nieznany rynek: ${market}`);
  }
  return won ? "won" : "lost";
}

/**
 * Rozlicza typ. Zwraca null, jeśli mecz jeszcze się nie zakończył
 * (typ pozostaje „w grze”).
 */
export function settlePick(
  market: MarketCode,
  selection: string,
  result: FixtureResult,
  now: Date = new Date(),
): PickOutcome | null {
  const status = result.statusShort;
  if (VOID_NOW.has(status)) return { status: "void", scoreHome: null, scoreAway: null };

  if (POSTPONED.has(status)) {
    const hours = (now.getTime() - new Date(result.kickoff).getTime()) / 3_600_000;
    return hours >= POSTPONED_VOID_AFTER_HOURS
      ? { status: "void", scoreHome: null, scoreAway: null }
      : null;
  }

  if (!FINISHED.has(status)) return null;
  if (result.fulltimeHome == null || result.fulltimeAway == null) return null;

  return {
    status: evaluateSelection(market, selection, result.fulltimeHome, result.fulltimeAway),
    scoreHome: result.fulltimeHome,
    scoreAway: result.fulltimeAway,
  };
}

export function roundOdds(x: number): number {
  return Math.round(x * 100) / 100;
}

/**
 * Status kuponu na podstawie statusów typów. Kupon rozliczamy, gdy wszystkie
 * typy są rozliczone. Zwrot na jednym zdarzeniu usuwa jego kurs z kuponu.
 */
export function settleCoupon(
  picks: { status: PickStatus; odds: number }[],
): { status: Exclude<PickStatus, "pending">; settledOdds: number | null } | null {
  if (picks.length === 0) return null;
  if (picks.some((p) => p.status === "pending")) return null;
  if (picks.some((p) => p.status === "lost")) {
    return { status: "lost", settledOdds: roundOdds(productOdds(picks.filter((p) => p.status !== "void"))) };
  }
  const active = picks.filter((p) => p.status === "won");
  if (active.length === 0) return { status: "void", settledOdds: null };
  return { status: "won", settledOdds: roundOdds(productOdds(active)) };
}

export function productOdds(picks: { odds: number }[]): number {
  return picks.reduce((acc, p) => acc * p.odds, 1);
}
