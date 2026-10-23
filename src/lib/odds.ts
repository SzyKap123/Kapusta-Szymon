import { SELECTIONS } from "./markets";
import type { MarketOdds } from "./sports/types";

// Uśrednianie kursów z wielu źródeł. Nazwy bukmacherów są tu odrzucane
// i nigdy nie trafiają do bazy ani na stronę.

export interface RawBookmaker {
  name?: string;
  bets: { name: string; values: { value: string; odd: string | number }[] }[];
}

export function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Zaokrąglenie kursu do 0,05 — podajemy kurs przybliżony („ok. 2.05”). */
export function approxOdds(x: number): number {
  return Math.round(Math.round(x * 20) / 20 * 100) / 100;
}

export function aggregateOdds(bookmakers: RawBookmaker[]): MarketOdds[] {
  const collected = new Map<string, number[]>();
  for (const bm of bookmakers) {
    for (const bet of bm.bets ?? []) {
      for (const v of bet.values ?? []) {
        const def = SELECTIONS.find((s) => s.apiBet === bet.name && s.apiValue === String(v.value));
        if (!def) continue;
        const odd = Number(v.odd);
        if (!Number.isFinite(odd) || odd <= 1.01 || odd > 50) continue;
        const key = `${def.market}:${def.selection}`;
        const arr = collected.get(key) ?? [];
        arr.push(odd);
        collected.set(key, arr);
      }
    }
  }

  const out: MarketOdds[] = [];
  for (const def of SELECTIONS) {
    const arr = collected.get(`${def.market}:${def.selection}`);
    if (!arr?.length) continue;
    out.push({
      market: def.market,
      selection: def.selection,
      label: def.label,
      odds: approxOdds(median(arr)),
      sources: arr.length,
    });
  }
  return out;
}

export function formatOdds(x: number): string {
  return x.toFixed(2);
}
