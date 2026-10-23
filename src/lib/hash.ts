import { createHash } from "node:crypto";
import type { CouponInput } from "./types";

/**
 * Odcisk (SHA-256) treści kuponu publikowany w momencie wydania.
 * Pozwala każdemu sprawdzić po meczu, że płatny typ nie został podmieniony.
 */
export function couponContentHash(input: CouponInput, publishedAt: string): string {
  const canonical = JSON.stringify({
    date: input.date,
    kind: input.kind,
    publishedAt,
    picks: input.picks.map((p) => [p.fixtureId, p.market, p.selection, p.odds, p.confidence, p.reasoning]),
  });
  return createHash("sha256").update(canonical).digest("hex");
}
