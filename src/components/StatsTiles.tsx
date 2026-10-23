import { formatPct, formatSignedPct, type Stats } from "@/lib/stats";

export function StatsTiles({ stats }: { stats: Stats }) {
  const tiles = [
    { label: "Rozliczone", value: String(stats.won + stats.lost + stats.void), hint: `${stats.won} W · ${stats.lost} P · ${stats.void} Z` },
    { label: "Trafność", value: formatPct(stats.hitRate), hint: "wygrane / (wygrane + przegrane)" },
    {
      label: "Yield",
      value: formatSignedPct(stats.yieldPct),
      hint: "przy stałej stawce",
      tone: stats.yieldPct == null ? "" : stats.yieldPct >= 0 ? "text-win" : "text-loss",
    },
    { label: "Śr. kurs", value: stats.averageOdds?.toFixed(2) ?? "—", hint: `zysk: ${stats.profitUnits > 0 ? "+" : ""}${stats.profitUnits.toFixed(2).replace(".", ",")} j.` },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="card">
          <p className="text-xs uppercase tracking-wide text-muted">{t.label}</p>
          <p className={`mt-1 text-2xl font-bold ${t.tone ?? ""}`}>{t.value}</p>
          <p className="mt-1 text-xs text-muted">{t.hint}</p>
        </div>
      ))}
    </div>
  );
}
