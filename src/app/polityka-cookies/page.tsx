import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Polityka cookies" };

export default function CookiesPage() {
  return (
    <LegalPage title="Polityka cookies" updated="23.10.2026">
      <h2>1. Czym są cookies</h2>
      <p>
        Cookies (ciasteczka) to małe pliki tekstowe zapisywane w Twojej przeglądarce. Pozwalają m.in. utrzymać
        zalogowanie między kolejnymi wizytami.
      </p>

      <h2>2. Jakich cookies używamy</h2>
      <h3>Niezbędne (nie wymagają zgody)</h3>
      <ul>
        <li>
          <strong>sb-…-auth-token</strong> — utrzymanie sesji zalogowanego użytkownika (Supabase); do wylogowania lub
          wygaśnięcia sesji;
        </li>
        <li>
          <strong>cookie_consent</strong> — zapamiętanie Twojej decyzji dotyczącej cookies; 12 miesięcy.
        </li>
      </ul>
      <p>
        Na stronie płatności (checkout.stripe.com) cookies ustawia Stripe w celu realizacji płatności i zapobiegania
        oszustwom — zgodnie z polityką prywatności Stripe.
      </p>
      <h3>Opcjonalne (tylko za zgodą)</h3>
      <p>
        Obecnie nie używamy cookies analitycznych ani marketingowych. Jeśli w przyszłości zaczniemy (np. anonimowe
        statystyki odwiedzin), zostaną włączone wyłącznie po wybraniu „Akceptuję wszystkie” w banerze, a niniejsza
        polityka zostanie zaktualizowana.
      </p>

      <h2>3. Jak zmienić ustawienia</h2>
      <p>
        Możesz w każdej chwili usunąć cookies lub zablokować ich zapisywanie w ustawieniach przeglądarki. Po usunięciu
        cookie „cookie_consent” baner pojawi się ponownie. Zablokowanie cookies niezbędnych uniemożliwi zalogowanie.
      </p>
    </LegalPage>
  );
}
