import Link from "next/link";
import { config } from "@/lib/config";
import { HelpLine } from "./Disclaimer";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-surface/50">
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 text-sm text-muted">
        <p>
          <strong className="text-ink">Ważne:</strong> wszystkie typy w serwisie są generowane automatycznie przez sztuczną
          inteligencję (AI) na podstawie publicznie dostępnych danych sportowych. Stanowią wyłącznie opinię i nie są
          poradą finansową. Nie gwarantujemy wygranej — wyniki z przeszłości nie przesądzają o przyszłych. Kursy są
          przybliżone. Serwis nie jest bukmacherem, nie przyjmuje zakładów i nie współpracuje z żadnym bukmacherem.
          Hazard może uzależniać. Serwis jest przeznaczony wyłącznie dla osób pełnoletnich (18+).
        </p>
        <HelpLine />
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/regulamin" className="hover:text-ink">Regulamin</Link>
          <Link href="/polityka-prywatnosci" className="hover:text-ink">Polityka prywatności</Link>
          <Link href="/polityka-cookies" className="hover:text-ink">Polityka cookies</Link>
          <Link href="/odpowiedzialna-gra" className="hover:text-ink">Odpowiedzialna gra</Link>
          <a href={`mailto:${config.contactEmail}`} className="hover:text-ink">Kontakt</a>
        </nav>
        <p className="text-xs">© {new Date().getFullYear()} {config.siteName}</p>
      </div>
    </footer>
  );
}
