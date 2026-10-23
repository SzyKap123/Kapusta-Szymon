import { config } from "@/lib/config";

/**
 * Dane usługodawcy — UZUPEŁNIJ w zmiennych środowiskowych przed startem
 * (wymóg ustawy o świadczeniu usług drogą elektroniczną i ustawy o prawach konsumenta).
 */
export function operator() {
  return {
    name: process.env.NEXT_PUBLIC_OPERATOR_NAME || "[IMIĘ I NAZWISKO]",
    address: process.env.NEXT_PUBLIC_OPERATOR_ADDRESS || "[ADRES DO DORĘCZEŃ]",
    email: config.contactEmail,
    site: config.siteUrl,
    siteName: config.siteName,
  };
}

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="prose-legal mx-auto max-w-3xl">
      <div className="mb-6 rounded-xl border border-warn/50 bg-warn/10 p-4 text-sm text-amber-100">
        <strong>WERSJA ROBOCZA — DO SPRAWDZENIA PRZEZ PRAWNIKA.</strong> Dokument przygotowano jako szkic. Przed
        uruchomieniem sprzedaży należy go zweryfikować z prawnikiem i uzupełnić dane oznaczone [w nawiasach].
      </div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-xs text-muted">Wersja z dnia {updated}</p>
      {children}
    </article>
  );
}
