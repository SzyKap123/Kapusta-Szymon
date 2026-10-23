import type { Metadata } from "next";
import { LegalPage, operator } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Polityka prywatności" };

export default function PrivacyPage() {
  const o = operator();
  return (
    <LegalPage title="Polityka prywatności" updated="23.10.2026">
      <h2>1. Administrator danych</h2>
      <p>
        Administratorem Twoich danych osobowych jest {o.name}, {o.address}, e-mail: {o.email} („Administrator”). We
        wszystkich sprawach dotyczących danych osobowych możesz pisać na ten adres.
      </p>

      <h2>2. Jakie dane przetwarzamy, w jakim celu i na jakiej podstawie</h2>
      <ul>
        <li>
          <strong>Konto</strong> — adres e-mail, zaszyfrowane hasło, data złożenia oświadczenia o pełnoletności i
          akceptacji regulaminu: w celu założenia i prowadzenia konta (art. 6 ust. 1 lit. b RODO — wykonanie umowy).
        </li>
        <li>
          <strong>Zakupy</strong> — historia zakupów i subskrypcji, identyfikatory transakcji, treść i data złożonych
          zgód: w celu realizacji umowy (art. 6 ust. 1 lit. b RODO), prowadzenia ewidencji sprzedaży i rozliczeń
          podatkowych (art. 6 ust. 1 lit. c RODO) oraz obrony przed roszczeniami (art. 6 ust. 1 lit. f RODO).
        </li>
        <li>
          <strong>Powiadomienia e-mail</strong> o nowych typach dla subskrybentów: jako element usługi subskrypcji
          (art. 6 ust. 1 lit. b RODO).
        </li>
        <li>
          <strong>Dane techniczne</strong> (adres IP, logi serwera, pliki cookies niezbędne): w celu zapewnienia
          bezpieczeństwa i działania Serwisu (art. 6 ust. 1 lit. f RODO).
        </li>
      </ul>
      <p>Nie przekazujemy Twoich danych osobowych do systemu AI generującego typy — model otrzymuje wyłącznie dane sportowe.</p>
      <p>Nie stosujemy profilowania ani zautomatyzowanego podejmowania decyzji wywołujących wobec Ciebie skutki prawne.</p>

      <h2>3. Odbiorcy danych (podmioty przetwarzające)</h2>
      <ul>
        <li>Supabase Inc. — baza danych i logowanie (serwery w UE — [UZUPEŁNIJ REGION, np. Frankfurt]);</li>
        <li>Netlify Inc. — hosting strony;</li>
        <li>Stripe Payments Europe Ltd. — obsługa płatności (Stripe jest odrębnym administratorem danych płatniczych);</li>
        <li>Resend (Plus Five Five, Inc.) — wysyłka e-maili;</li>
        <li>GitHub Inc. — uruchamianie zadań automatycznych.</li>
      </ul>
      <p>
        Część z tych podmiotów ma siedzibę w USA. Przekazanie danych odbywa się na podstawie decyzji Komisji Europejskiej
        stwierdzającej odpowiedni stopień ochrony (EU-U.S. Data Privacy Framework) lub standardowych klauzul umownych.
        [DO WERYFIKACJI PRZEZ PRAWNIKA — sprawdź aktualny status certyfikacji dostawców.]
      </p>

      <h2>4. Jak długo przechowujemy dane</h2>
      <ul>
        <li>dane konta — do czasu usunięcia konta;</li>
        <li>dane dotyczące transakcji i ewidencja sprzedaży — przez 5 lat od końca roku podatkowego (przepisy podatkowe);</li>
        <li>dane potrzebne do obrony przed roszczeniami — do upływu terminów przedawnienia;</li>
        <li>logi techniczne — do 30 dni.</li>
      </ul>

      <h2>5. Twoje prawa</h2>
      <p>
        Masz prawo do: dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych
        oraz wniesienia sprzeciwu wobec przetwarzania opartego na uzasadnionym interesie. Aby skorzystać z praw, napisz na{" "}
        {o.email}. Masz też prawo wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa).
      </p>

      <h2>6. Dobrowolność</h2>
      <p>Podanie danych jest dobrowolne, ale niezbędne do założenia konta i zakupu treści.</p>

      <h2>7. Cookies</h2>
      <p>Zasady stosowania plików cookies opisuje Polityka cookies.</p>
    </LegalPage>
  );
}
