import type { Coupon } from "./types";

export interface Viewer {
  userId: string | null;
  subscribed: boolean;
  purchasedCouponIds: Set<string>;
  isAdmin: boolean;
}

export const ANONYMOUS: Viewer = { userId: null, subscribed: false, purchasedCouponIds: new Set(), isAdmin: false };

/**
 * Czy dana osoba widzi pełną treść kuponu.
 * Płatne kupony są publicznie odsłaniane po rozliczeniu — dzięki temu historia
 * i statystyki są w pełni jawne.
 */
export function canViewCoupon(coupon: Coupon, viewer: Viewer): boolean {
  if (coupon.isFree) return true;
  if (coupon.status !== "pending") return true;
  if (viewer.isAdmin || viewer.subscribed) return true;
  return viewer.purchasedCouponIds.has(coupon.id);
}

/** Wersja kuponu bezpieczna do wysłania do przeglądarki (bez treści płatnej). */
export type PublicCoupon = Omit<Coupon, "picks"> & {
  locked: boolean;
  picks: (Pick | LockedPick)[];
};
type Pick = Coupon["picks"][number];
export interface LockedPick {
  id: string;
  locked: true;
  league: string;
  kickoff: string;
}

export function redactCoupon(coupon: Coupon, viewer: Viewer): PublicCoupon {
  if (canViewCoupon(coupon, viewer)) return { ...coupon, locked: false };
  return {
    ...coupon,
    summary: "",
    locked: true,
    picks: coupon.picks.map((p) => ({ id: p.id, locked: true as const, league: p.league, kickoff: p.kickoff })),
  };
}

export function isLockedPick(p: Pick | LockedPick): p is LockedPick {
  return (p as LockedPick).locked === true;
}
