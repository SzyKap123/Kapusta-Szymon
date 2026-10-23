import type { Repository } from "../db/repository";
import { settleCoupon, settlePick } from "../settlement";
import type { SportsDataProvider } from "../sports/types";
import type { Pick } from "../types";

/** Typy sprawdzamy dopiero ok. 2 godziny po rozpoczęciu meczu. */
export const SETTLE_AFTER_MINUTES = 115;

export interface SettleResult {
  checkedPicks: number;
  settledPicks: number;
  settledCoupons: number;
}

export async function runSettlement(
  deps: { repo: Repository; provider: SportsDataProvider; now?: () => Date },
): Promise<SettleResult> {
  const now = deps.now?.() ?? new Date();
  const pending = await deps.repo.listPendingPicks();
  const due = pending.filter((p) => now.getTime() - new Date(p.kickoff).getTime() >= SETTLE_AFTER_MINUTES * 60_000);

  let settledPicks = 0;
  const touchedCoupons = new Set<string>();

  if (due.length) {
    const ids = [...new Set(due.map((p) => p.fixtureId))];
    const results = new Map((await deps.provider.getResults(ids)).map((r) => [r.fixtureId, r]));
    for (const pick of due) {
      const result = results.get(pick.fixtureId);
      if (!result) continue;
      const outcome = settlePick(pick.market, pick.selection, result, now);
      if (!outcome) continue;
      await deps.repo.settlePick(pick.id, outcome.status, outcome.scoreHome, outcome.scoreAway);
      settledPicks++;
      touchedCoupons.add(pick.couponId);
    }
  }

  // Rozlicz kupony, których wszystkie typy są już rozliczone
  // (sprawdzamy też kupony z wcześniejszych przebiegów).
  const stillPending = new Set((await deps.repo.listPendingPicks()).map((p: Pick) => p.couponId));
  const pendingCoupons = await deps.repo.listCoupons({ status: "pending" });
  let settledCoupons = 0;
  for (const coupon of pendingCoupons) {
    if (stillPending.has(coupon.id)) continue;
    const res = settleCoupon(coupon.picks);
    if (!res) continue;
    await deps.repo.settleCoupon(coupon.id, res.status, res.settledOdds);
    settledCoupons++;
  }

  return { checkedPicks: due.length, settledPicks, settledCoupons };
}
