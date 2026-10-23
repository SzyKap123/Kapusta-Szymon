import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { togglePauseAction } from "../actions";
import { StatusBadge } from "@/components/CouponCard";
import { Notice } from "@/components/Notice";
import { StatsTiles } from "@/components/StatsTiles";
import { getCurrentUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { getRepo } from "@/lib/db";
import { PAUSE_SETTING } from "@/lib/jobs/generate";
import { currentQuarterBounds, formatPln, limitStatus, sumCents } from "@/lib/revenue";
import { computeStats } from "@/lib/stats";
import { formatWarsaw, warsawDate } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Panel administratora", robots: { index: false } };

const RUN_LABEL: Record<string, string> = {
  running: "w trakcie",
  success: "sukces",
  failed: "BŁĄD",
  no_matches: "brak meczów",
  paused: "wstrzymane",
};

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect("/");

  const repo = getRepo();
  const now = new Date();
  const q = currentQuarterBounds(now);
  const monthStart = `${warsawDate(now).slice(0, 7)}-01`;

  const [paused, users, subscribers, coupons, runs, quarterLedger, allLedger] = await Promise.all([
    repo.getSetting(PAUSE_SETTING),
    repo.countUsers(),
    repo.countActiveSubscribers(now),
    repo.listCoupons({}),
    repo.listRuns(15),
    repo.listLedger(q.fromIso, q.toIso),
    repo.listLedger(),
  ]);

  const isPaused = paused === "true";
  const quarterCents = sumCents(quarterLedger);
  const monthCents = sumCents(quarterLedger.filter((e) => warsawDate(new Date(e.occurredAt)) >= monthStart));
  const totalCents = sumCents(allLedger);
  const limit = limitStatus(quarterCents, config.quarterlyLimitCents);
  const pct = Math.min(100, limit.ratio * 100);
  const barColor = { ok: "bg-brand", warning: "bg-warn", danger: "bg-loss", exceeded: "bg-loss" }[limit.level];
  const lastRun = runs[0];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Panel administratora</h1>

      {lastRun?.status === "failed" && (
        <Notice kind="error">
          Ostatnie generowanie zakończyło się błędem: {lastRun.message}. Zobacz plik „CO-ZROBIC-GDY-COS-NIE-DZIALA.md”.
        </Notice>
      )}

      {/* Limit działalności nierejestrowanej */}
      <section className="card space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-semibold">
              Przychód w bieżącym kwartale (Q{q.quarter} {q.year})
            </h2>
            <p className="text-xs text-muted">
              {q.from} – {q.to} · limit działalności nierejestrowanej: {formatPln(config.quarterlyLimitCents)}
            </p>
          </div>
          <p className="text-2xl font-bold">{formatPln(quarterCents)}</p>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-sm text-muted">
          Wykorzystano {(limit.ratio * 100).toFixed(1).replace(".", ",")}% limitu · pozostało {formatPln(Math.max(0, limit.remainingCents))}
        </p>
        {limit.level === "warning" && (
          <Notice>
            <strong>Uwaga:</strong> przekroczono 80% kwartalnego limitu. Przygotuj się do rejestracji działalności lub
            rozważ wstrzymanie sprzedaży do końca kwartału.
          </Notice>
        )}
        {(limit.level === "danger" || limit.level === "exceeded") && (
          <Notice kind="error">
            <strong>{limit.level === "exceeded" ? "Limit przekroczony!" : "Limit prawie wyczerpany!"}</strong> Po przekroczeniu
            limitu masz 7 dni na złożenie wniosku o wpis do CEIDG (działalność staje się firmą od dnia przekroczenia).
            Skonsultuj się z księgowym.
          </Notice>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Przychód — ten miesiąc", value: formatPln(monthCents) },
          { label: "Przychód — łącznie", value: formatPln(totalCents) },
          { label: "Użytkownicy", value: String(users) },
          { label: "Aktywne subskrypcje", value: String(subscribers) },
        ].map((t) => (
          <div key={t.label} className="card">
            <p className="text-xs uppercase tracking-wide text-muted">{t.label}</p>
            <p className="mt-1 text-xl font-bold">{t.value}</p>
          </div>
        ))}
      </section>

      {/* Publikacja */}
      <section className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Publikacja typów</h2>
          <p className="text-sm text-muted">
            {isPaused
              ? "WSTRZYMANA — automat nie opublikuje nowych typów, dopóki nie wznowisz."
              : "Aktywna — nowe typy pojawiają się codziennie ok. 9:00."}
          </p>
        </div>
        <form action={togglePauseAction}>
          <input type="hidden" name="paused" value={isPaused ? "false" : "true"} />
          <button className={isPaused ? "btn-primary" : "btn-ghost border-loss/60 text-loss"}>
            {isPaused ? "Wznów publikację" : "Wstrzymaj publikację"}
          </button>
        </form>
      </section>

      {/* Ewidencja */}
      <section className="card space-y-3">
        <h2 className="font-semibold">Ewidencja sprzedaży (CSV)</h2>
        <p className="text-sm text-muted">
          Plik otworzysz w Excelu. Zawiera każdą sprzedaż i zwrot z datą, kwotą i sumą narastająco w kwartale.
        </p>
        <div className="flex flex-wrap gap-2">
          <a className="btn-primary" href={`/api/admin/export?od=${q.from}&do=${q.to}`}>
            Pobierz bieżący kwartał
          </a>
          <a className="btn-ghost" href="/api/admin/export">
            Pobierz całość
          </a>
        </div>
        <form action="/api/admin/export" method="get" className="flex flex-wrap items-end gap-2">
          <div>
            <label className="label" htmlFor="od">Od</label>
            <input className="input" type="date" id="od" name="od" required />
          </div>
          <div>
            <label className="label" htmlFor="do">Do</label>
            <input className="input" type="date" id="do" name="do" required />
          </div>
          <button className="btn-ghost">Pobierz zakres</button>
        </form>
        {quarterLedger.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="text-left text-xs uppercase text-muted">
                <tr>
                  <th className="py-2 pr-3">Data</th>
                  <th className="py-2 pr-3">Opis</th>
                  <th className="py-2 text-right">Kwota</th>
                </tr>
              </thead>
              <tbody>
                {[...quarterLedger].reverse().slice(0, 10).map((e) => (
                  <tr key={e.id} className="border-t border-line">
                    <td className="py-2 pr-3 text-muted">{formatWarsaw(e.occurredAt)}</td>
                    <td className="py-2 pr-3">{e.description}</td>
                    <td className={`py-2 text-right ${e.amountCents < 0 ? "text-loss" : ""}`}>{formatPln(e.amountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Typy */}
      <section className="space-y-3">
        <h2 className="font-semibold">Skuteczność typów</h2>
        <StatsTiles stats={computeStats(coupons)} />
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-left text-xs uppercase text-muted">
              <tr>
                <th className="py-2 pr-3">Data</th>
                <th className="py-2 pr-3">Kupon</th>
                <th className="py-2 pr-3 text-right">Kurs</th>
                <th className="py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {coupons.slice(0, 12).map((c) => (
                <tr key={c.id} className="border-t border-line">
                  <td className="py-2 pr-3 text-muted">{c.date}</td>
                  <td className="py-2 pr-3">
                    {c.title} {c.isFree && <span className="text-xs text-brand">(darmowy)</span>}
                  </td>
                  <td className="py-2 pr-3 text-right">{c.totalOdds.toFixed(2)}</td>
                  <td className="py-2 text-right">
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Dziennik automatu */}
      <section className="card space-y-2 overflow-x-auto">
        <h2 className="font-semibold">Dziennik automatycznego generowania</h2>
        <table className="w-full min-w-[480px] text-sm">
          <tbody>
            {runs.map((r) => (
              <tr key={r.id} className="border-t border-line align-top">
                <td className="py-2 pr-3 whitespace-nowrap text-muted">{formatWarsaw(r.startedAt)}</td>
                <td className={`py-2 pr-3 font-semibold ${r.status === "failed" ? "text-loss" : r.status === "success" ? "text-win" : ""}`}>
                  {RUN_LABEL[r.status] ?? r.status}
                </td>
                <td className="py-2 text-muted">{r.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-muted">
          Ręczne uruchomienie: GitHub → repozytorium → zakładka „Actions” → „Zadania automatyczne” → „Run workflow”.
        </p>
      </section>
    </div>
  );
}
