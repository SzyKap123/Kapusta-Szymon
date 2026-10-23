import Link from "next/link";
import { CouponCard } from "@/components/CouponCard";
import { AiNotice } from "@/components/Disclaimer";
import { firstParam, Notice } from "@/components/Notice";
import { StatsTiles } from "@/components/StatsTiles";
import { redactCoupon } from "@/lib/access";
import { getCurrentUser, getViewer } from "@/lib/auth";
import { getRepo } from "@/lib/db";
import { computeStats } from "@/lib/stats";
import { formatDatePl, warsawDate } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const repo = getRepo();
  const user = await getCurrentUser();
  const viewer = await getViewer(user);
  const today = warsawDate();

  const [todays, settled] = await Promise.all([repo.listCoupons({ from: today, to: today }), repo.listCoupons({ status: "settled" })]);
  const stats = computeStats(settled);
  const coupons = todays.map((c) => redactCoupon(c, viewer));

  return (
    <div className="space-y-6">
      {firstParam(sp.platnosc) === "anulowana" && <Notice>Płatność została anulowana. Nic nie zostało pobrane.</Notice>}

      <section className="space-y-2">
        <p className="text-sm text-muted first-letter:uppercase">{formatDatePl(today)}</p>
        <h1 className="text-2xl font-bold sm:text-3xl">Typy na dziś</h1>
        <p className="text-muted">
          Codziennie ok. 9:00 sztuczna inteligencja analizuje terminarz, kursy, formę drużyn i kontuzje, a następnie
          publikuje kupon dnia i kilka typów pojedynczych. Każdy typ trafia do{" "}
          <Link href="/historia" className="text-brand underline">
            publicznej historii
          </Link>{" "}
          — także przegrane.
        </p>
      </section>

      <AiNotice />

      {coupons.length === 0 ? (
        <div className="card text-center">
          <p className="font-semibold">Dzisiejsze typy jeszcze się nie pojawiły.</p>
          <p className="mt-1 text-sm text-muted">
            Publikujemy je codziennie ok. 9:00. W niektóre dni (np. przerwa reprezentacyjna) typów może nie być.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {coupons.map((c) => (
            <div key={c.id} className={c.kind === "coupon_of_day" ? "md:col-span-2" : ""}>
              <CouponCard coupon={c} loggedIn={!!user} />
            </div>
          ))}
        </div>
      )}

      {!viewer.subscribed && coupons.some((c) => c.locked) && (
        <div className="card flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold">Wszystkie typy w subskrypcji</p>
            <p className="text-sm text-muted">Kupon dnia i wszystkie typy pojedyncze codziennie. Anulujesz jednym kliknięciem.</p>
          </div>
          <Link href="/cennik" className="btn-primary">
            Zobacz cennik
          </Link>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold">Skuteczność — pełna historia</h2>
          <Link href="/statystyki" className="text-sm text-brand underline">
            Szczegóły
          </Link>
        </div>
        <StatsTiles stats={stats} />
        <p className="text-xs text-muted">
          Statystyki obejmują wszystkie opublikowane kupony (darmowe i płatne). Typów nie można edytować ani ukrywać po
          publikacji. Wyniki historyczne nie gwarantują przyszłych.
        </p>
      </section>
    </div>
  );
}
