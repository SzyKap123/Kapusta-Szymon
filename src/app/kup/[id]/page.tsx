import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AiNotice } from "@/components/Disclaimer";
import { firstParam, Notice } from "@/components/Notice";
import { PurchaseForm } from "@/components/PurchaseForm";
import { canViewCoupon } from "@/lib/access";
import { getCurrentUser, getViewer } from "@/lib/auth";
import { config } from "@/lib/config";
import { getRepo } from "@/lib/db";
import { formatPln } from "@/lib/revenue";
import { formatWarsaw } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Zakup kuponu" };

export default async function BuyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/logowanie?next=/kup/${id}`);
  const coupon = await getRepo().getCoupon(id);
  if (!coupon) notFound();
  const viewer = await getViewer(user);
  if (canViewCoupon(coupon, viewer)) redirect("/");

  const firstKickoff = coupon.picks.map((p) => p.kickoff).sort()[0];
  const closed = new Date(firstKickoff).getTime() <= Date.now();

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-2xl font-bold">Zakup kuponu</h1>
      {firstParam(sp.blad) && <Notice kind="error">{firstParam(sp.blad)}</Notice>}
      <div className="card space-y-2">
        <p className="font-semibold">{coupon.title}</p>
        <p className="text-sm text-muted">
          {coupon.picks.length} {coupon.picks.length === 1 ? "zdarzenie" : "zdarzenia"} · łączny kurs ok. {coupon.totalOdds.toFixed(2)} · pierwszy mecz {formatWarsaw(firstKickoff)}
        </p>
        <p className="text-2xl font-bold">{formatPln(coupon.priceCents)}</p>
      </div>
      <AiNotice />
      {closed ? (
        <Notice kind="error">Sprzedaż tego kuponu jest zamknięta — pierwszy mecz już się rozpoczął.</Notice>
      ) : config.demoMode ? (
        <Notice>Płatności są wyłączone w trybie demo.</Notice>
      ) : (
        <div className="card">
          <PurchaseForm kind="coupon" couponId={coupon.id} label={`Zamawiam i płacę ${formatPln(coupon.priceCents)}`} />
        </div>
      )}
      <p className="text-sm text-muted">
        Taniej wychodzi <Link href="/cennik" className="text-brand underline">subskrypcja</Link> — wszystkie typy codziennie.
      </p>
    </div>
  );
}
