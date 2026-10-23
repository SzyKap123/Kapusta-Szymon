import Link from "next/link";
import type { Metadata } from "next";
import { CouponCard } from "@/components/CouponCard";
import { firstParam } from "@/components/Notice";
import { redactCoupon } from "@/lib/access";
import { getCurrentUser, getViewer } from "@/lib/auth";
import { getRepo } from "@/lib/db";
import { formatDatePl } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Historia typów" };

const PER_PAGE = 30;

export default async function HistoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(firstParam(sp.strona)) || 1);
  const repo = getRepo();
  const user = await getCurrentUser();
  const viewer = await getViewer(user);

  const [coupons, total] = await Promise.all([
    repo.listCoupons({ limit: PER_PAGE, offset: (page - 1) * PER_PAGE }),
    repo.countCoupons({}),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  const byDate = new Map<string, typeof coupons>();
  for (const c of coupons) byDate.set(c.date, [...(byDate.get(c.date) ?? []), c]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Pełna historia typów</h1>
        <p className="text-muted">
          Wszystkie opublikowane kupony — wygrane, przegrane i zwroty. Płatne typy są odsłaniane publicznie po
          rozliczeniu. Każdy kupon ma „odcisk treści” (SHA-256) widoczny od chwili publikacji, dzięki czemu można
          sprawdzić, że nic nie zostało zmienione.
        </p>
      </header>

      {coupons.length === 0 && <p className="card text-muted">Historia jest jeszcze pusta.</p>}

      {[...byDate.entries()].map(([date, list]) => (
        <section key={date} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted first-letter:uppercase">{formatDatePl(date)}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {list.map((c) => (
              <div key={c.id} className={c.kind === "coupon_of_day" ? "md:col-span-2" : ""}>
                <CouponCard coupon={redactCoupon(c, viewer)} loggedIn={!!user} />
              </div>
            ))}
          </div>
        </section>
      ))}

      {pages > 1 && (
        <nav className="flex items-center justify-center gap-3">
          {page > 1 && (
            <Link href={`/historia?strona=${page - 1}`} className="btn-ghost">
              ← Nowsze
            </Link>
          )}
          <span className="text-sm text-muted">
            Strona {page} z {pages}
          </span>
          {page < pages && (
            <Link href={`/historia?strona=${page + 1}`} className="btn-ghost">
              Starsze →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
