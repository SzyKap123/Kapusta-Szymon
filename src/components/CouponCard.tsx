import Link from "next/link";
import { isLockedPick, type PublicCoupon } from "@/lib/access";
import { selectionLabel } from "@/lib/markets";
import { formatPln } from "@/lib/revenue";
import { formatWarsaw } from "@/lib/time";
import type { CouponStatus, Pick } from "@/lib/types";

const STATUS: Record<CouponStatus, { label: string; cls: string }> = {
  pending: { label: "W grze", cls: "bg-surface-2 text-muted border-line" },
  won: { label: "Wygrany", cls: "bg-win/15 text-win border-win/40" },
  lost: { label: "Przegrany", cls: "bg-loss/15 text-loss border-loss/40" },
  void: { label: "Zwrot", cls: "bg-void/15 text-void border-void/40" },
};

export function StatusBadge({ status }: { status: CouponStatus }) {
  const s = STATUS[status];
  return <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}

function Confidence({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted" title={`Pewność modelu AI: ${value}/5`}>
      Pewność AI
      <span className="flex gap-0.5" aria-label={`${value} z 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`h-1.5 w-3 rounded-full ${i <= value ? "bg-brand" : "bg-line"}`} />
        ))}
      </span>
    </span>
  );
}

function PickRow({ p }: { p: Pick }) {
  const score = p.scoreHome != null ? `${p.scoreHome}:${p.scoreAway}` : null;
  return (
    <li className="space-y-2 border-t border-line pt-3 first:border-0 first:pt-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">
            {p.homeTeam} – {p.awayTeam}
            {score && <span className="ml-2 text-muted">({score})</span>}
          </p>
          <p className="text-xs text-muted">
            {p.league} · {formatWarsaw(p.kickoff)}
          </p>
        </div>
        {p.status !== "pending" && <StatusBadge status={p.status} />}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="rounded-lg bg-brand/15 px-2.5 py-1 text-sm font-semibold text-brand">{selectionLabel(p.market, p.selection)}</span>
        <span className="text-sm">
          kurs ok. <strong>{p.odds.toFixed(2)}</strong>
        </span>
        <Confidence value={p.confidence} />
      </div>
      <p className="text-sm leading-relaxed text-slate-300">{p.reasoning}</p>
    </li>
  );
}

export function CouponCard({ coupon, loggedIn }: { coupon: PublicCoupon; loggedIn: boolean }) {
  const isCod = coupon.kind === "coupon_of_day";
  return (
    <article className={`card ${isCod ? "border-brand/50 ring-1 ring-brand/20" : ""}`}>
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {isCod && <span className="rounded-md bg-brand px-2 py-0.5 text-xs font-bold text-slate-950">KUPON DNIA</span>}
          {coupon.isFree ? (
            <span className="rounded-md border border-brand/40 px-2 py-0.5 text-xs font-semibold text-brand">Darmowy</span>
          ) : (
            <span className="rounded-md border border-line px-2 py-0.5 text-xs text-muted">Premium</span>
          )}
          <StatusBadge status={coupon.status} />
        </div>
        <span className="text-sm text-muted">
          {coupon.status !== "pending" && coupon.settledOdds != null && coupon.settledOdds !== coupon.totalOdds
            ? `kurs rozliczenia ${coupon.settledOdds.toFixed(2)}`
            : `łączny kurs ok. ${coupon.totalOdds.toFixed(2)}`}
        </span>
      </header>

      {isCod && <h3 className="mb-1 text-lg font-bold">{coupon.title}</h3>}
      {!coupon.locked && coupon.summary && <p className="mb-3 text-sm text-muted">{coupon.summary}</p>}

      {coupon.locked ? (
        <div className="rounded-xl border border-dashed border-line bg-bg/50 p-4 text-center">
          <p className="text-sm text-muted">
            {coupon.picks.length} {coupon.picks.length === 1 ? "zdarzenie" : "zdarzenia"} ·{" "}
            {[...new Set(coupon.picks.map((p) => p.league))].join(", ")} · pierwszy mecz{" "}
            {formatWarsaw(coupon.picks.map((p) => p.kickoff).sort()[0])}
          </p>
          <p className="mt-1 text-xs text-muted">Treść zostanie publicznie odsłonięta po rozliczeniu.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Link href={loggedIn ? `/kup/${coupon.id}` : `/logowanie?next=/kup/${coupon.id}`} className="btn-primary">
              Odblokuj za {formatPln(coupon.priceCents)}
            </Link>
            <Link href="/cennik" className="btn-ghost">
              Subskrypcja
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">{coupon.picks.map((p) => (isLockedPick(p) ? null : <PickRow key={p.id} p={p} />))}</ul>
      )}

      <footer className="mt-4 flex flex-wrap justify-between gap-2 border-t border-line pt-3 text-[11px] text-muted">
        <span>Opublikowano: {formatWarsaw(coupon.publishedAt, { year: "numeric" })}</span>
        <span title={coupon.contentHash} className="font-mono">
          Odcisk treści: {coupon.contentHash.slice(0, 12)}…
        </span>
      </footer>
    </article>
  );
}
