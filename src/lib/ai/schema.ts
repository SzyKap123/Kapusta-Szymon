import { z } from "zod/v4";

export const AiPickSchema = z.object({
  fixture_id: z.number().int().describe("fixture_id meczu z listy kandydatów"),
  market: z.enum(["1X2", "DC", "OU", "BTTS"]),
  selection: z
    .string()
    .describe('Dokładnie jedna z wartości "selection" podanych dla tego meczu w danych, np. "home", "1X", "over_2.5", "yes"'),
  confidence: z.number().int().describe("Pewność modelu w skali 1–5 (1 = niska, 5 = wysoka)"),
  reasoning: z
    .string()
    .describe("Krótkie, rzeczowe uzasadnienie po polsku (1–3 zdania, maks. 300 znaków), oparte na danych"),
});

export const AiTipsSchema = z.object({
  coupon_of_day: z.object({
    summary: z.string().describe("Jedno zdanie po polsku podsumowujące kupon"),
    picks: z.array(AiPickSchema).describe("2–4 zdarzenia z różnych meczów, łączny kurs ok. 2.0"),
  }),
  singles: z.array(AiPickSchema).describe("3–5 pojedynczych typów z meczów innych niż w kuponie dnia"),
  free_single_index: z.number().int().describe("Indeks (od 0) typu z listy singles, który będzie darmowy"),
});

export type AiPick = z.infer<typeof AiPickSchema>;
export type AiTips = z.infer<typeof AiTipsSchema>;
