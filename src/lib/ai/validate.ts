import { checkText } from "../compliance";
import { roundOdds, productOdds } from "../settlement";
import type { CandidateFixture } from "../sports/types";
import type { CouponInput, MarketCode, PickInput } from "../types";
import type { AiPick, AiTips } from "./schema";

export const COUPON_ODDS_MIN = 1.7;
export const COUPON_ODDS_MAX = 2.4;
export const SINGLE_ODDS_MIN = 1.25;

export interface BuildResult {
  coupons: CouponInput[];
  /** Problemy blokujące publikację (do odesłania modelowi). */
  errors: string[];
  /** Odrzucone pojedyncze typy (nie blokują publikacji). */
  warnings: string[];
}

function toPick(p: AiPick, byId: Map<number, CandidateFixture>): { pick?: PickInput; error?: string } {
  const fx = byId.get(p.fixture_id);
  if (!fx) return { error: `Mecz o fixture_id ${p.fixture_id} nie istnieje w danych.` };
  const odds = fx.odds.find((o) => o.market === p.market && o.selection === p.selection);
  if (!odds) return { error: `Zakład ${p.market}/${p.selection} nie jest dostępny dla meczu ${p.fixture_id}.` };
  const reasoning = p.reasoning.trim().replace(/\s+/g, " ");
  if (reasoning.length < 15) return { error: `Zbyt krótkie uzasadnienie dla meczu ${p.fixture_id}.` };
  const issues = checkText(reasoning);
  if (issues.length) {
    return {
      error: `Niedozwolona treść w uzasadnieniu meczu ${p.fixture_id}: ${issues.map((i) => `"${i.match}"`).join(", ")}.`,
    };
  }
  return {
    pick: {
      fixtureId: fx.fixtureId,
      league: fx.league,
      homeTeam: fx.homeTeam,
      awayTeam: fx.awayTeam,
      kickoff: fx.kickoff,
      market: p.market as MarketCode,
      selection: p.selection,
      odds: odds.odds, // kurs zawsze z danych rynkowych, nigdy z odpowiedzi AI
      confidence: Math.min(5, Math.max(1, Math.round(p.confidence))),
      reasoning: reasoning.slice(0, 400),
    },
  };
}

/** Zamienia odpowiedź AI na kupony gotowe do publikacji, z pełną walidacją. */
export function buildCoupons(
  ai: AiTips,
  candidates: CandidateFixture[],
  opts: { date: string; couponPriceCents: number },
): BuildResult {
  const byId = new Map(candidates.map((c) => [c.fixtureId, c]));
  const errors: string[] = [];
  const warnings: string[] = [];

  // Kupon dnia
  const couponPicks: PickInput[] = [];
  for (const p of ai.coupon_of_day.picks) {
    const r = toPick(p, byId);
    if (r.error) errors.push(`Kupon dnia: ${r.error}`);
    else couponPicks.push(r.pick!);
  }
  const fixtureSet = new Set(couponPicks.map((p) => p.fixtureId));
  if (fixtureSet.size !== couponPicks.length) errors.push("Kupon dnia zawiera dwa zdarzenia z tego samego meczu.");
  if (couponPicks.length < 2 || couponPicks.length > 4) errors.push(`Kupon dnia musi mieć 2–4 zdarzenia (jest ${couponPicks.length}).`);
  const total = roundOdds(productOdds(couponPicks));
  if (couponPicks.length >= 2 && (total < COUPON_ODDS_MIN || total > COUPON_ODDS_MAX)) {
    errors.push(
      `Łączny kurs kuponu dnia wynosi ${total.toFixed(2)}, a powinien mieścić się w ${COUPON_ODDS_MIN}–${COUPON_ODDS_MAX} (cel ok. 2.0).`,
    );
  }
  const summaryIssues = checkText(ai.coupon_of_day.summary);
  if (summaryIssues.length) errors.push(`Niedozwolona treść w podsumowaniu kuponu: ${summaryIssues.map((i) => i.match).join(", ")}.`);

  // Pojedyncze typy — błędne odrzucamy, ale nie blokują publikacji
  const singles: PickInput[] = [];
  const freeIndex = ai.free_single_index;
  let freeFixture: number | null = null;
  ai.singles.forEach((p, i) => {
    const r = toPick(p, byId);
    if (r.error) return warnings.push(`Typ pojedynczy odrzucony: ${r.error}`);
    const pick = r.pick!;
    if (fixtureSet.has(pick.fixtureId)) return warnings.push(`Typ pojedynczy odrzucony: mecz ${pick.fixtureId} jest już w kuponie dnia.`);
    if (singles.some((s) => s.fixtureId === pick.fixtureId)) return warnings.push(`Typ pojedynczy odrzucony: duplikat meczu ${pick.fixtureId}.`);
    if (pick.odds < SINGLE_ODDS_MIN) return warnings.push(`Typ pojedynczy odrzucony: zbyt niski kurs (${pick.odds}).`);
    if (i === freeIndex) freeFixture = pick.fixtureId;
    singles.push(pick);
  });
  if (singles.length === 0) errors.push("Brak prawidłowych typów pojedynczych (potrzebne 3–5).");
  const kept = singles.slice(0, 5);
  if (freeFixture == null || !kept.some((s) => s.fixtureId === freeFixture)) freeFixture = kept[0]?.fixtureId ?? null;

  if (errors.length) return { coupons: [], errors, warnings };

  const coupons: CouponInput[] = [
    {
      date: opts.date,
      kind: "coupon_of_day",
      isFree: false,
      priceCents: opts.couponPriceCents,
      title: `Kupon dnia — kurs ok. ${total.toFixed(2)}`,
      summary: ai.coupon_of_day.summary.trim().slice(0, 300),
      picks: couponPicks,
    },
    ...kept.map(
      (p): CouponInput => ({
        date: opts.date,
        kind: "single",
        isFree: p.fixtureId === freeFixture,
        priceCents: opts.couponPriceCents,
        title: `${p.homeTeam} – ${p.awayTeam}`,
        summary: "",
        picks: [p],
      }),
    ),
  ];
  return { coupons, errors: [], warnings };
}
