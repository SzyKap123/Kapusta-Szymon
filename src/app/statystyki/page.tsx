import type { Metadata } from "next";
import { AiNotice } from "@/components/Disclaimer";
import { StatsTiles } from "@/components/StatsTiles";
import { getRepo } from "@/lib/db";
import { computeStats, formatPct, formatSignedPct, type StatsInput } from "@/lib/stats";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Statystyki" };

function Row({ label, items }: { label: string; items: StatsInput[] }) {
  const s = computeStats(items);
  return (
    <tr className="border-t border-line">
      <td className="py-2 pr-3">{label}</td>
      <td className="py-2 pr-3 text-right">{s.won + s.lost + s.void}</td>
      <td className="py-2 pr-3 text-right">
        {s.won}/{s.lost}/{s.void}
      </td>
      <td className="py-2 pr-3 text-right">{formatPct(s.hitRate)}</td>
      <td className={`py-2 pr-3 text-right ${s.yieldPct == null ? "" : s.yieldPct >= 0 ? "text-win" : "text-loss"}`}>{formatSignedPct(s.yieldPct)}</td>
      <td className="py-2 text-right">{s.averageOdds?.toFixed(2) ?? "—"}</td>
    </tr>
  );
}

export default async function StatsPage() {
  const all = await getRepo().listCoupons({});
  const settled = all.filter((c) => c.status !== "pending");
  const stats = computeStats(all);

  const months = new Map<string, typeof settled>();
  for (const c of settled) {
    const m = c.date.slice(0, 7);
    months.set(m, [...(months.get(m) ?? []), c]);
  }
  const monthName = (ym: string) =>
    new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${ym}-01T00:00:00Z`));

  const last30From = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Statystyki — uczciwie i w całości</h1>
        <p className="text-muted">
          Liczymy każdy opublikowany kupon, także darmowe i przegrane. Yield to zysk podzielony przez sumę stawek przy
          stałej stawce 1 jednostki na kupon; zwroty nie są liczone jako stawka. Kursy są przybliżone, więc rzeczywisty
          wynik zależy od kursu, po jakim ktoś by grał.
        </p>
      </header>

      <StatsTiles stats={stats} />
      {stats.pending > 0 && <p className="text-sm text-muted">W grze (jeszcze nierozliczone): {stats.pending}</p>}

      <section className="card overflow-x-auto">
        <h2 className="mb-2 font-semibold">Podział</h2>
        <table className="w-full min-w-[520px] text-sm">
          <thead className="text-left text-xs uppercase text-muted">
            <tr>
              <th className="py-2 pr-3">Kategoria</th>
              <th className="py-2 pr-3 text-right">Rozliczone</th>
              <th className="py-2 pr-3 text-right">W/P/Z</th>
              <th className="py-2 pr-3 text-right">Trafność</th>
              <th className="py-2 pr-3 text-right">Yield</th>
              <th className="py-2 text-right">Śr. kurs</th>
            </tr>
          </thead>
          <tbody>
            <Row label="Wszystkie" items={settled} />
            <Row label="Kupony dnia" items={settled.filter((c) => c.kind === "coupon_of_day")} />
            <Row label="Typy pojedyncze" items={settled.filter((c) => c.kind === "single")} />
            <Row label="Darmowe" items={settled.filter((c) => c.isFree)} />
            <Row label="Płatne" items={settled.filter((c) => !c.isFree)} />
            <Row label="Ostatnie 30 dni" items={settled.filter((c) => c.date >= last30From)} />
          </tbody>
        </table>
      </section>

      <section className="card overflow-x-auto">
        <h2 className="mb-2 font-semibold">Miesiąc po miesiącu</h2>
        {months.size === 0 ? (
          <p className="text-sm text-muted">Brak rozliczonych kuponów.</p>
        ) : (
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-left text-xs uppercase text-muted">
              <tr>
                <th className="py-2 pr-3">Miesiąc</th>
                <th className="py-2 pr-3 text-right">Rozliczone</th>
                <th className="py-2 pr-3 text-right">W/P/Z</th>
                <th className="py-2 pr-3 text-right">Trafność</th>
                <th className="py-2 pr-3 text-right">Yield</th>
                <th className="py-2 text-right">Śr. kurs</th>
              </tr>
            </thead>
            <tbody>
              {[...months.entries()].map(([m, items]) => (
                <Row key={m} label={monthName(m)} items={items} />
              ))}
            </tbody>
          </table>
        )}
      </section>

      <AiNotice />
    </div>
  );
}
