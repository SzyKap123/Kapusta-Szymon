import { quarterRange, TIMEZONE, warsawDate, warsawQuarter } from "./time";
import type { LedgerEntry } from "./types";

export const WARN_RATIO = 0.8;
export const DANGER_RATIO = 0.95;

/** Początek dnia w Polsce jako ISO UTC (uwzględnia czas letni/zimowy). */
export function warsawDayStartIso(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  // Szukamy przesunięcia strefy dla tej daty.
  const guess = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  const tzName = new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, timeZoneName: "longOffset" })
    .formatToParts(guess)
    .find((p) => p.type === "timeZoneName")?.value; // np. "GMT+02:00"
  const match = tzName?.match(/GMT([+-])(\d{2}):(\d{2})/);
  const offsetMin = match ? (match[1] === "+" ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3])) : 0;
  return new Date(guess.getTime() - offsetMin * 60_000).toISOString();
}

export function nextDay(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

export function currentQuarterBounds(now: Date = new Date()) {
  const { year, quarter } = warsawQuarter(now);
  const { from, to } = quarterRange(year, quarter);
  return { year, quarter, from, to, fromIso: warsawDayStartIso(from), toIso: warsawDayStartIso(nextDay(to)) };
}

export function sumCents(entries: LedgerEntry[]): number {
  return entries.reduce((s, e) => s + e.amountCents, 0);
}

export type LimitLevel = "ok" | "warning" | "danger" | "exceeded";

export function limitStatus(revenueCents: number, limitCents: number): { ratio: number; level: LimitLevel; remainingCents: number } {
  const ratio = limitCents > 0 ? revenueCents / limitCents : 0;
  const level: LimitLevel = ratio > 1 ? "exceeded" : ratio >= DANGER_RATIO ? "danger" : ratio >= WARN_RATIO ? "warning" : "ok";
  return { ratio, level, remainingCents: limitCents - revenueCents };
}

export function formatPln(cents: number): string {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(cents / 100);
}

/** Ewidencja sprzedaży (uproszczona) w CSV — separator ";" (Excel w polskiej wersji). */
export function ledgerToCsv(entries: LedgerEntry[]): string {
  const header = ["Lp.", "Data sprzedaży", "Rodzaj", "Opis", "Kwota (zł)", "Narastająco w kwartale (zł)", "Identyfikator transakcji"];
  const kindLabel = { coupon: "Kupon", subscription: "Subskrypcja", refund: "Zwrot" } as const;
  const fmt = (c: number) => (c / 100).toFixed(2).replace(".", ",");
  const esc = (s: string) => (/[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

  let running = 0;
  let currentQ = "";
  const rows = entries.map((e, i) => {
    const d = new Date(e.occurredAt);
    const { year, quarter } = warsawQuarter(d);
    const q = `${year}-Q${quarter}`;
    if (q !== currentQ) {
      currentQ = q;
      running = 0;
    }
    running += e.amountCents;
    return [String(i + 1), warsawDate(d), kindLabel[e.kind], e.description, fmt(e.amountCents), fmt(running), e.externalId]
      .map(esc)
      .join(";");
  });
  // BOM, żeby Excel poprawnie pokazał polskie znaki.
  return "﻿" + [header.join(";"), ...rows].join("\r\n") + "\r\n";
}
