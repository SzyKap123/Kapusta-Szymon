import type { Metadata } from "next";
import { HELP_LINE } from "@/lib/config";

export const metadata: Metadata = { title: "Odpowiedzialna gra i pomoc" };

export default function ResponsiblePage() {
  return (
    <article className="prose-legal mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Odpowiedzialna gra i pomoc</h1>

      <div className="my-6 rounded-2xl border border-brand/40 bg-brand/10 p-5">
        <p className="text-base! text-ink!">
          <strong>Hazard może uzależniać.</strong> Jeśli czujesz, że tracisz kontrolę — porozmawiaj z kimś. Pomoc jest
          bezpłatna i anonimowa.
        </p>
        <ul className="mt-3">
          <li>
            Telefon zaufania uzależnień behawioralnych:{" "}
            <a href={`tel:${HELP_LINE.phone.replace(/\s/g, "")}`}>
              <strong>{HELP_LINE.phone}</strong>
            </a>{" "}
            ({HELP_LINE.hours})
          </li>
          <li>
            Poradnia internetowa i baza placówek:{" "}
            <a href={HELP_LINE.website} target="_blank" rel="noopener noreferrer">
              {HELP_LINE.websiteLabel}
            </a>
          </li>
          <li>
            Krajowe Centrum Przeciwdziałania Uzależnieniom:{" "}
            <a href="https://kcpu.gov.pl" target="_blank" rel="noopener noreferrer">
              kcpu.gov.pl
            </a>
          </li>
          <li>W sytuacji kryzysowej: numer alarmowy 112.</li>
        </ul>
      </div>

      <h2>Typy AI to opinia, nie gwarancja</h2>
      <p>
        Wszystkie typy w serwisie generuje automatycznie sztuczna inteligencja. Nawet najlepsza analiza nie przewidzi
        wyniku meczu. Bukmacherzy mają wbudowaną marżę, dlatego większość osób grających długoterminowo traci pieniądze.
        Nasze statystyki pokazują wszystkie wyniki — także przegrane.
      </p>

      <h2>Sygnały ostrzegawcze</h2>
      <ul>
        <li>grasz za pieniądze, których nie możesz stracić, lub pożyczasz na grę;</li>
        <li>próbujesz „odegrać się” po przegranej;</li>
        <li>zwiększasz stawki, żeby poczuć te same emocje;</li>
        <li>ukrywasz grę przed bliskimi, zaniedbujesz pracę, naukę lub rodzinę;</li>
        <li>czujesz niepokój lub rozdrażnienie, gdy nie grasz.</li>
      </ul>

      <h2>Zasady bezpieczniejszej gry</h2>
      <ul>
        <li>traktuj zakłady wyłącznie jako rozrywkę, nie sposób na zarabianie;</li>
        <li>ustal z góry budżet i limit czasu — i trzymaj się ich;</li>
        <li>nigdy nie graj pod wpływem alkoholu ani emocji;</li>
        <li>korzystaj z narzędzi samowykluczenia i limitów oferowanych przez legalnych operatorów;</li>
        <li>graj wyłącznie u podmiotów posiadających zezwolenie Ministra Finansów.</li>
      </ul>

      <h2>Tylko dla dorosłych</h2>
      <p>Serwis jest przeznaczony wyłącznie dla osób, które ukończyły 18 lat.</p>
    </article>
  );
}
