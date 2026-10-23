import type { Metadata } from "next";
import { LegalPage, operator } from "@/components/LegalPage";
import { config, HELP_LINE } from "@/lib/config";
import { DIGITAL_CONTENT_CONSENT } from "@/lib/payments/checkout";
import { formatPln } from "@/lib/revenue";

export const metadata: Metadata = { title: "Regulamin" };

export default function TermsPage() {
  const o = operator();
  return (
    <LegalPage title={`Regulamin serwisu ${o.siteName}`} updated="23.10.2026">
      <h2>§ 1. Postanowienia ogólne</h2>
      <ol>
        <li>
          Regulamin określa zasady korzystania z serwisu internetowego {o.siteName} dostępnego pod adresem {o.site}{" "}
          („Serwis”), w tym zasady zawierania umów o dostarczanie treści cyfrowych.
        </li>
        <li>
          Usługodawcą i sprzedawcą jest {o.name}, adres do doręczeń: {o.address}, e-mail: {o.email} („Usługodawca”),
          osoba fizyczna prowadząca działalność nierejestrowaną w rozumieniu art. 5 ustawy z dnia 6 marca 2018 r. —
          Prawo przedsiębiorców.
        </li>
        <li>Regulamin jest udostępniany nieodpłatnie, w formie umożliwiającej jego pobranie, utrwalenie i wydrukowanie.</li>
      </ol>

      <h2>§ 2. Charakter treści — ważne zastrzeżenia</h2>
      <ol>
        <li>
          Serwis publikuje typy (prognozy) dotyczące wyników wydarzeń sportowych. <strong>Typy są generowane
          automatycznie przez system sztucznej inteligencji (AI)</strong> na podstawie publicznie dostępnych danych
          sportowych (m.in. terminarz, przybliżone kursy rynkowe, forma drużyn, kontuzje).
        </li>
        <li>
          Typy stanowią wyłącznie <strong>opinię</strong> i materiał informacyjno-rozrywkowy. Nie są poradą
          inwestycyjną, finansową ani zachętą do udziału w grach hazardowych. <strong>Usługodawca nie gwarantuje
          trafności typów ani osiągnięcia jakiegokolwiek zysku.</strong> Wyniki historyczne nie przesądzają o
          przyszłych.
        </li>
        <li>
          Kursy podawane w Serwisie są przybliżone (zaokrąglona mediana z wielu źródeł) i mogą różnić się od kursów
          oferowanych w danym momencie.
        </li>
        <li>
          Serwis nie jest bukmacherem, nie przyjmuje zakładów, nie pośredniczy w ich zawieraniu i nie współpracuje z
          żadnym podmiotem urządzającym gry hazardowe. Serwis nie zawiera reklam ani odnośników do takich podmiotów.
        </li>
        <li>
          Decyzja o ewentualnym udziale w zakładach należy wyłącznie do Użytkownika, który ponosi jej skutki.
          Udział w zakładach jest dozwolony wyłącznie u podmiotów posiadających zezwolenie Ministra Finansów.
        </li>
        <li>
          Hazard może uzależniać. Pomoc: telefon zaufania {HELP_LINE.phone} ({HELP_LINE.hours}), {HELP_LINE.websiteLabel}.
        </li>
      </ol>

      <h2>§ 3. Warunki korzystania</h2>
      <ol>
        <li>Z Serwisu mogą korzystać wyłącznie osoby pełnoletnie (które ukończyły 18 lat) i mające pełną zdolność do czynności prawnych.</li>
        <li>
          Wymagania techniczne: urządzenie z dostępem do Internetu, aktualna przeglądarka internetowa z włączoną obsługą
          plików cookies i JavaScript, aktywne konto e-mail.
        </li>
        <li>Zakazane jest dostarczanie treści o charakterze bezprawnym oraz udostępnianie płatnych treści osobom trzecim.</li>
      </ol>

      <h2>§ 4. Konto</h2>
      <ol>
        <li>
          Założenie konta jest bezpłatne i wymaga podania adresu e-mail, hasła, złożenia oświadczenia o ukończeniu 18
          lat oraz akceptacji Regulaminu. Z chwilą potwierdzenia adresu e-mail zostaje zawarta umowa o prowadzenie konta
          na czas nieokreślony.
        </li>
        <li>Użytkownik może w każdej chwili usunąć konto, wysyłając prośbę na adres {o.email}.</li>
      </ol>

      <h2>§ 5. Treści płatne, ceny i płatności</h2>
      <ol>
        <li>
          Część typów jest dostępna bezpłatnie. Dostęp do pozostałych można uzyskać przez: (a) zakup pojedynczego kuponu
          (cena: {formatPln(config.couponPriceCents)}), (b) subskrypcję miesięczną (cena: {formatPln(config.subscriptionPriceCents)}{" "}
          za miesiąc), dającą dostęp do wszystkich typów publikowanych w okresie subskrypcji.
        </li>
        <li>Ceny są cenami końcowymi. Usługodawca korzysta ze zwolnienia z VAT (art. 113 ust. 1 ustawy o VAT).</li>
        <li>
          Płatności obsługuje Stripe Payments Europe Ltd. Dostępne metody (np. BLIK, karta, Przelewy24) są
          wyświetlane na stronie płatności.
        </li>
        <li>
          Umowa zostaje zawarta z chwilą złożenia zamówienia (kliknięcie przycisku „Zamawiam i płacę”). Dostęp do
          treści jest udzielany niezwłocznie po zaksięgowaniu płatności.
        </li>
        <li>Pojedynczy kupon można kupić wyłącznie przed rozpoczęciem pierwszego meczu, którego dotyczy.</li>
        <li>
          Subskrypcja odnawia się automatycznie co miesiąc, a opłata jest pobierana z góry. Użytkownik może ją anulować w
          każdej chwili w zakładce „Moje konto” → „Zarządzaj subskrypcją / anuluj”. Anulowanie skutkuje zakończeniem
          subskrypcji z końcem opłaconego okresu; kolejne opłaty nie są pobierane.
        </li>
        <li>Na żądanie Użytkownika Usługodawca wystawia rachunek.</li>
      </ol>

      <h2>§ 6. Prawo odstąpienia od umowy</h2>
      <ol>
        <li>
          Konsumentowi przysługuje co do zasady prawo odstąpienia od umowy zawartej na odległość w terminie 14 dni bez
          podania przyczyny.
        </li>
        <li>
          Zgodnie z art. 38 ust. 1 pkt 13 ustawy z dnia 30 maja 2014 r. o prawach konsumenta prawo odstąpienia nie
          przysługuje w odniesieniu do umowy o dostarczanie treści cyfrowych, jeżeli spełnianie świadczenia rozpoczęło
          się za wyraźną i uprzednią zgodą konsumenta, który został poinformowany przed rozpoczęciem świadczenia, że po
          spełnieniu świadczenia utraci prawo odstąpienia od umowy, i przyjął to do wiadomości.
        </li>
        <li>
          Przed każdym zakupem Użytkownik zaznacza oświadczenie o treści: „{DIGITAL_CONTENT_CONSENT}”. Potwierdzenie
          zgody jest przesyłane w wiadomości e-mail potwierdzającej zawarcie umowy.
        </li>
        <li>
          Prawo do anulowania subskrypcji na przyszłość (§ 5 ust. 6) przysługuje niezależnie od powyższego.
        </li>
      </ol>

      <h2>§ 7. Reklamacje</h2>
      <ol>
        <li>
          Reklamacje dotyczące działania Serwisu lub zgodności treści cyfrowej z umową można składać na adres {o.email}.
          Reklamacja powinna zawierać adres e-mail konta i opis problemu.
        </li>
        <li>Usługodawca rozpatruje reklamację w terminie 14 dni od jej otrzymania i odpowiada e-mailem.</li>
        <li>
          Brak trafności typu nie stanowi niezgodności treści cyfrowej z umową — typy są opinią generowaną przez AI
          (§ 2).
        </li>
        <li>
          Konsument może skorzystać z pozasądowych sposobów rozpatrywania sporów, np. pomocy miejskiego lub powiatowego
          rzecznika konsumentów albo Wojewódzkiego Inspektoratu Inspekcji Handlowej.
        </li>
      </ol>

      <h2>§ 8. Prawa autorskie</h2>
      <p>
        Treści Serwisu przeznaczone są do osobistego użytku Użytkownika. Kopiowanie i rozpowszechnianie płatnych treści,
        w tym ich odsprzedaż, jest zabronione.
      </p>

      <h2>§ 9. Odpowiedzialność</h2>
      <ol>
        <li>
          Usługodawca nie ponosi odpowiedzialności za decyzje podjęte przez Użytkownika na podstawie typów, w tym za
          straty poniesione w zakładach.
        </li>
        <li>Usługodawca dokłada starań, aby Serwis działał nieprzerwanie, jednak dopuszcza przerwy techniczne i dni bez publikacji typów.</li>
        <li>Postanowienia niniejszego paragrafu nie ograniczają uprawnień konsumenta wynikających z bezwzględnie obowiązujących przepisów.</li>
      </ol>

      <h2>§ 10. Postanowienia końcowe</h2>
      <ol>
        <li>Zasady przetwarzania danych osobowych opisuje Polityka prywatności.</li>
        <li>
          Usługodawca może zmienić Regulamin z ważnych przyczyn (np. zmiana przepisów, cen, zakresu usług), informując
          Użytkowników e-mailem z co najmniej 14-dniowym wyprzedzeniem. Zmiana nie dotyczy umów już opłaconych.
        </li>
        <li>W sprawach nieuregulowanych stosuje się przepisy prawa polskiego, w szczególności Kodeksu cywilnego i ustawy o prawach konsumenta.</li>
      </ol>
    </LegalPage>
  );
}
