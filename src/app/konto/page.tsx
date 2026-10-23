import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { confirmAdultAction, logoutAction } from "../actions";
import { firstParam, Notice } from "@/components/Notice";
import { getCurrentUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { getRepo } from "@/lib/db";
import { isSubscriptionActive } from "@/lib/db/repository";
import { formatWarsaw } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Moje konto" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie?next=/konto");

  const repo = getRepo();
  const [profile, sub, purchasedIds] = await Promise.all([
    repo.getProfile(user.id),
    repo.getSubscription(user.id),
    repo.listAccessibleCouponIds(user.id),
  ]);
  const active = isSubscriptionActive(sub, new Date());
  const purchased = (await Promise.all(purchasedIds.slice(-20).map((id) => repo.getCoupon(id)))).filter(Boolean);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold">Moje konto</h1>
      {firstParam(sp.platnosc) === "ok" && (
        <Notice kind="success">
          Dziękujemy za płatność! Dostęp zostanie aktywowany w ciągu kilku sekund — jeśli typy są nadal zablokowane, odśwież stronę.
        </Notice>
      )}
      {firstParam(sp.info) && <Notice kind="success">{firstParam(sp.info)}</Notice>}
      {firstParam(sp.blad) && <Notice kind="error">{firstParam(sp.blad)}</Notice>}

      <section className="card space-y-2">
        <p className="text-sm text-muted">Zalogowano jako</p>
        <p className="font-semibold">{user.email}</p>
        {!profile?.adultConfirmedAt && (
          <form action={confirmAdultAction} className="mt-3 space-y-3 rounded-xl border border-warn/40 bg-warn/10 p-3">
            <label className="flex gap-3 text-sm">
              <input type="checkbox" name="adult" required className="mt-1 h-4 w-4 shrink-0 accent-emerald-500" />
              <span>Oświadczam, że mam ukończone 18 lat. Bez tego oświadczenia zakup nie jest możliwy.</span>
            </label>
            <button className="btn-primary">Zapisz oświadczenie</button>
          </form>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Subskrypcja</h2>
        {active && sub ? (
          <>
            <p className="text-sm">
              Status: <strong className="text-win">aktywna</strong>
              {sub.currentPeriodEnd && (
                <>
                  {" "}
                  — {sub.cancelAtPeriodEnd ? "wygaśnie" : "odnowi się"} {formatWarsaw(sub.currentPeriodEnd, { year: "numeric" })}
                </>
              )}
            </p>
            {sub.cancelAtPeriodEnd && <p className="text-sm text-muted">Subskrypcja jest anulowana — nie zostaniesz ponownie obciążony.</p>}
            <form action="/api/stripe/portal" method="post">
              <button className="btn-ghost">Zarządzaj subskrypcją / anuluj</button>
            </form>
            <p className="text-xs text-muted">
              Anulowanie zajmuje jedno kliknięcie. Dostęp pozostaje do końca opłaconego okresu.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">Nie masz aktywnej subskrypcji.</p>
            <Link href="/cennik" className="btn-primary">Zobacz cennik</Link>
            {profile?.stripeCustomerId && !config.demoMode && (
              <form action="/api/stripe/portal" method="post">
                <button className="text-sm text-brand underline">Historia płatności i faktury</button>
              </form>
            )}
          </>
        )}
      </section>

      {purchased.length > 0 && (
        <section className="card space-y-2">
          <h2 className="font-semibold">Kupione kupony</h2>
          <ul className="space-y-1 text-sm">
            {purchased.map((c) => (
              <li key={c!.id} className="flex justify-between gap-2">
                <span>{c!.title}</span>
                <span className="text-muted">{c!.date}</span>
              </li>
            ))}
          </ul>
          <Link href="/" className="text-sm text-brand underline">Przejdź do dzisiejszych typów</Link>
        </section>
      )}

      <form action={logoutAction}>
        <button className="btn-ghost">Wyloguj się</button>
      </form>
    </div>
  );
}
