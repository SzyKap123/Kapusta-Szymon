import type { MarketCode } from "./types";

// Rynki, które serwis potrafi automatycznie rozliczyć na podstawie wyniku po 90 minutach.
export interface SelectionDef {
  market: MarketCode;
  selection: string;
  label: string;
  /** Nazwa zakładu i wartości w API-Football. */
  apiBet: string;
  apiValue: string;
}

const OU_LINES = ["1.5", "2.5", "3.5"];

export const SELECTIONS: SelectionDef[] = [
  { market: "1X2", selection: "home", label: "Wygrana gospodarzy (1)", apiBet: "Match Winner", apiValue: "Home" },
  { market: "1X2", selection: "draw", label: "Remis (X)", apiBet: "Match Winner", apiValue: "Draw" },
  { market: "1X2", selection: "away", label: "Wygrana gości (2)", apiBet: "Match Winner", apiValue: "Away" },
  { market: "DC", selection: "1X", label: "Podwójna szansa 1X", apiBet: "Double Chance", apiValue: "Home/Draw" },
  { market: "DC", selection: "X2", label: "Podwójna szansa X2", apiBet: "Double Chance", apiValue: "Draw/Away" },
  { market: "DC", selection: "12", label: "Podwójna szansa 12", apiBet: "Double Chance", apiValue: "Home/Away" },
  ...OU_LINES.flatMap((line): SelectionDef[] => [
    {
      market: "OU",
      selection: `over_${line}`,
      label: `Powyżej ${line.replace(".", ",")} gola`,
      apiBet: "Goals Over/Under",
      apiValue: `Over ${line}`,
    },
    {
      market: "OU",
      selection: `under_${line}`,
      label: `Poniżej ${line.replace(".", ",")} gola`,
      apiBet: "Goals Over/Under",
      apiValue: `Under ${line}`,
    },
  ]),
  { market: "BTTS", selection: "yes", label: "Obie drużyny strzelą: tak", apiBet: "Both Teams Score", apiValue: "Yes" },
  { market: "BTTS", selection: "no", label: "Obie drużyny strzelą: nie", apiBet: "Both Teams Score", apiValue: "No" },
];

export function selectionKey(market: string, selection: string): string {
  return `${market}:${selection}`;
}

export function findSelection(market: string, selection: string): SelectionDef | undefined {
  return SELECTIONS.find((s) => s.market === market && s.selection === selection);
}

export function selectionLabel(market: string, selection: string): string {
  return findSelection(market, selection)?.label ?? `${market} ${selection}`;
}
