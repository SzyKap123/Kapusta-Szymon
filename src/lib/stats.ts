import type { CouponKind, CouponStatus } from "./types";

export interface StatsInput {
  status: CouponStatus;
  kind: CouponKind;
  isFree: boolean;
  totalOdds: number;
  settledOdds: number | null;
}

export interface Stats {
  total: number;
  pending: number;
  won: number;
  lost: number;
  void: number;
  /** % trafień (wygrane / (wygrane + przegrane)), null gdy brak danych. */
  hitRate: number | null;
  /** Zysk w jednostkach przy stałej stawce 1 j. */
  profitUnits: number;
  /** Yield = zysk / suma stawek × 100%. Zwroty nie liczą się do stawek. */
  yieldPct: number | null;
  averageOdds: number | null;
}

export function computeStats(coupons: StatsInput[]): Stats {
  let won = 0;
  let lost = 0;
  let voided = 0;
  let pending = 0;
  let profit = 0;
  let oddsSum = 0;

  for (const c of coupons) {
    switch (c.status) {
      case "won": {
        const odds = c.settledOdds ?? c.totalOdds;
        won++;
        profit += odds - 1;
        oddsSum += odds;
        break;
      }
      case "lost":
        lost++;
        profit -= 1;
        oddsSum += c.settledOdds ?? c.totalOdds;
        break;
      case "void":
        voided++;
        break;
      default:
        pending++;
    }
  }

  const staked = won + lost;
  return {
    total: coupons.length,
    pending,
    won,
    lost,
    void: voided,
    hitRate: staked ? (won / staked) * 100 : null,
    profitUnits: Math.round(profit * 100) / 100,
    yieldPct: staked ? Math.round((profit / staked) * 10000) / 100 : null,
    averageOdds: staked ? Math.round((oddsSum / staked) * 100) / 100 : null,
  };
}

export function formatPct(x: number | null, digits = 1): string {
  if (x == null) return "—";
  return `${x.toFixed(digits).replace(".", ",")}%`;
}

export function formatSignedPct(x: number | null): string {
  if (x == null) return "—";
  const s = x > 0 ? "+" : "";
  return `${s}${x.toFixed(1).replace(".", ",")}%`;
}
