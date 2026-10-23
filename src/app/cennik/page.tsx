import Link from "next/link";
import type { Metadata } from "next";
import { AiNotice } from "@/components/Disclaimer";
import { firstParam, Notice } from "@/components/Notice";
import { PurchaseForm } from "@/components/PurchaseForm";
import { getCurrentUser, getViewer } from "@/lib/auth";
import { config } from "@/lib/config";
import { formatPln } from "@/lib/revenue";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cennik" };

export default async function PricingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const viewer = await getViewer(user);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Cennik</h1>
        <p className="text-muted">Jeden typ dziennie jest zawsze darmowy. Pozostałe możesz kupić pojedynczo albo w subskrypcji.</p>
      </header>
      {firstParam(sp.blad) && <Notice kind="error">{firstParam(sp.blad)}</Notice>}
      {firstParam(sp.platnosc) === "anulowana" && <Notice>Płatność została anulowana. Nic nie zostało pobrane.</Notice>}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card space-y-2">
          <h2 className="font-semibold">Darmowy</h2>
          <p className="text-3xl font-bold">0 zł</p>
          <ul className="space-y-1 text-sm text-muted">
            <li>• 1 typ pojedynczy dziennie</li>
            <li>• Pełna historia i statystyki</li>
          </ul>
        </div>
        <div className="card space-y-2">
          <h2 className="font-semibold">Pojedynczy kupon</h2>
          <p className="text-3xl font-bold">{formatPln(config.couponPriceCents)}</p>
          <ul className="space-y-1 text-sm text-muted">
            <li>• Dostęp do wybranego kuponu (np. kuponu dnia)</li>
            <li>• Kupisz go przy kuponie na stronie głównej</li>
            <li>• Sprzedaż kończy się z pierwszym meczem</li>
          </ul>
          <Link href="/" className="btn-ghost">Wybierz kupon</Link>
        </div>
        <div className="card space-y-3 border-brand/50 ring-1 ring-brand/20">
          <h2 className="font-semibold">Subskrypcja miesięczna</h2>
          <p className="text-3xl font-bold">
            {formatPln(config.subscriptionPriceCents)} <span className="text-base font-normal text-muted">/ mies.</span>
          </p>
          <ul className="space-y-1 text-sm text-muted">
            <li>• Kupon dnia i wszystkie typy pojedyncze</li>
            <li>• E-mail, gdy pojawią się nowe typy</li>
            <li>• Anulujesz w każdej chwili jednym kliknięciem</li>
          </ul>
          {viewer.subscribed ? (
            <Notice kind="success">Masz aktywną subskrypcję.</Notice>
          ) : user ? (
            config.demoMode ? <Notice>Płatności są wyłączone w trybie demo.</Notice> : <PurchaseForm kind="subscription" label="Zamawiam i płacę" />
          ) : (
            <Link href="/logowanie?next=/cennik" className="btn-primary">Zaloguj się, aby kupić</Link>
          )}
        </div>
      </div>

      <AiNotice />
      <p className="text-xs text-muted">
        Ceny zawierają wszystkie opłaty. Sprzedawca korzysta ze zwolnienia z VAT (art. 113 ust. 1 ustawy o VAT). Subskrypcja odnawia się co miesiąc do
        czasu anulowania. Szczegóły w <Link href="/regulamin" className="underline">regulaminie</Link>.
      </p>
    </div>
  );
}
