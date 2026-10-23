# Co zrobić, gdy coś przestanie działać

Spokojnie — opublikowane typy, konta i płatności są bezpieczne w bazie. Poniżej najczęstsze sytuacje
i proste kroki. Zawsze możesz też wkleić mi (Claude) treść e-maila z błędem — powiem, co zrobić.

**Trzy miejsca, w których sprawdzisz stan serwisu:**
1. **Panel administratora** na stronie (przycisk „Panel”) → sekcja „Dziennik automatycznego generowania”.
2. **GitHub → repozytorium → zakładka Actions** — każde automatyczne zadanie ma tu zielony ✅ lub czerwony ❌ znaczek.
   Kliknięcie w czerwony pokazuje dokładny błąd.
3. **Netlify → Twoja strona → Deploys / Logs** — błędy samej strony.

---

## 1. Dostałem e-mail „Nie udało się wygenerować typów”

System sam spróbuje ponownie o kolejnej pełnej godzinie (maks. 3 próby dziennie). Przeczytaj „Błąd” w e-mailu:

| Fragment błędu | Co to znaczy | Co zrobić |
|---|---|---|
| `credit balance is too low` / `billing` | Skończyły się środki w Anthropic | console.anthropic.com → Billing → doładuj 5 USD |
| `authentication_error` / `invalid x-api-key` | Zły lub usunięty klucz AI | Utwórz nowy klucz w Anthropic i podmień `ANTHROPIC_API_KEY` w GitHub → Settings → Secrets |
| `API-Football ... HTTP 401/403` lub `token` | Zły klucz API-Football | Sprawdź klucz w dashboard.api-football.com i podmień `API_FOOTBALL_KEY` |
| `requests` / `limit` / `reached the request limit` | Wyczerpany dzienny limit 100 zapytań | Nic — jutro limit się odnowi. Gdy się powtarza: zmniejsz liczbę lig (`LEAGUE_IDS`) |
| `Free plans do not have access to this season` | Darmowy plan nie obejmuje bieżącego sezonu | Napisz do mnie — dodam darmowe źródło zastępcze |
| `AI zwróciło nieprawidłowe typy` | AI dwa razy dało odpowiedź niezgodną z zasadami (np. zły kurs kuponu) | Zwykle samo przejdzie przy następnej próbie. Możesz uruchomić ręcznie (punkt 6) |
| `Baza danych` / `fetch failed` / `supabase` | Problem z Supabase (np. projekt wstrzymany) | Punkt 4 |

## 2. Dostałem e-mail „Brak typów na dziś”

Oznacza to, że do ok. 10:45 nic się nie opublikowało.
1. Wejdź w GitHub → **Actions**. Czy dzisiaj w ogóle było uruchomienie?
   - **Nie było żadnego** → GitHub wyłącza zaplanowane zadania w repozytoriach publicznych po 60 dniach bez
     żadnej zmiany w repozytorium. Kliknij **Zadania automatyczne** → **Enable workflow** (jeśli widać), a potem
     uruchom ręcznie (punkt 6). Aby temu zapobiec, raz na 1–2 miesiące zrób dowolną drobną zmianę w repozytorium
     (np. edytuj ten plik na github.com i kliknij „Commit changes”).
   - **Było, ale czerwone ❌** → kliknij i przeczytaj błąd → tabela w punkcie 1.
2. Sprawdź w Panelu, czy publikacja nie jest **wstrzymana**.

## 3. Strona się nie otwiera / pokazuje błąd

1. Netlify → **Deploys**. Jeśli ostatni deploy jest czerwony („Failed”) — kliknij **Retry deploy** albo przywróć
   poprzednią działającą wersję: kliknij zielony deploy → **Publish deploy**.
2. Netlify → **Site configuration → Environment variables** — sprawdź, czy żadna zmienna nie zniknęła.
3. Problem z domeną (strona działa pod `...netlify.app`, ale nie pod Twoją domeną) → sprawdź, czy domena jest
   opłacona i czy rekordy DNS się nie zmieniły (Netlify → Domain management pokazuje ostrzeżenia).
4. Netlify → panel konta → **Usage** — jeśli przekroczysz darmowy limit, Netlify może wstrzymać stronę do
   następnego miesiąca. Rozwiązanie: plan płatny lub poczekać.

## 4. Supabase — „projekt wstrzymany” (paused)

Darmowy projekt jest usypiany po 7 dniach bez żadnej aktywności. Codzienne zadania temu zapobiegają, ale jeśli
zadania nie działały przez tydzień:
1. supabase.com → Twój projekt → **Restore / Resume project**. Dane zostają.
2. Uruchom ręcznie generowanie (punkt 6).

## 5. Płatności

| Problem | Co zrobić |
|---|---|
| Klient zapłacił, a kupon dalej jest zablokowany | Stripe → Developers → Webhooks → Twój endpoint → zobacz, czy zdarzenia mają błąd. Kliknij zdarzenie → **Resend**. Jeśli błąd 400 „Nieprawidłowy podpis” — `STRIPE_WEBHOOK_SECRET` w Netlify nie pasuje do webhooka (skopiuj ponownie i zrób **Trigger deploy**). |
| Klient nie może anulować subskrypcji | Sprawdź Stripe → Settings → Billing → Customer portal (musi być zapisany). Do czasu naprawy anuluj ręcznie: Stripe → Customers → klient → subskrypcja → **Cancel**. |
| Klient prosi o zwrot | Stripe → Payments → płatność → **Refund**. Zwrot automatycznie trafi do ewidencji jako kwota ujemna. |
| Stripe zablokował konto | Nie zakładaj nowego konta. Odpowiedz Stripe, przesyłając opis z `docs/wiadomosc-do-stripe.md`. Wstrzymaj sprzedaż (możesz zostawić darmowe typy). |

## 6. Jak ręcznie uruchomić zadanie

GitHub → repozytorium → **Actions** → **Zadania automatyczne** → **Run workflow** →
- `generate` + zaznacz **force** — wygeneruj dzisiejsze typy teraz (jeśli dziś już są, nic się nie zdubluje),
- `settle` — rozlicz zakończone mecze teraz,
- `watchdog` — sprawdzenie i ewentualny alarm.

## 7. Typ „wisi” nierozliczony

Przychodzi e-mail „Typy czekają na rozliczenie ponad 3 dni”. Najczęściej mecz został przełożony — po 48 godzinach
od planowanej godziny system uzna go za **zwrot**. Jeśli to inny przypadek, uruchom ręcznie `settle` (punkt 6) i
sprawdź błąd w Actions. Opublikowanych typów nie da się ręcznie zmienić — to celowe zabezpieczenie uczciwości statystyk.

## 8. Chcę na chwilę zatrzymać publikację

Panel → **Wstrzymaj publikację**. Wznowienie tym samym przyciskiem. Typy już opublikowane zostają i nadal się rozliczają.

## 9. Licznik w Panelu robi się żółty / czerwony

- **Żółty (80%)** — zbliżasz się do kwartalnego limitu działalności nierejestrowanej (10 813,50 zł w 2026 r.).
- **Czerwony (95%+)** — rozważ wstrzymanie sprzedaży do końca kwartału lub przygotuj rejestrację firmy.
- **Przekroczony** — masz **7 dni** na złożenie wniosku do CEIDG (biznes.gov.pl). Skonsultuj się z księgowym.
  Limit na kolejny rok zmienisz zmienną `QUARTERLY_LIMIT_PLN` w Netlify.

## 10. Wymiana klucza (np. wyciekł)

1. Wygeneruj nowy klucz u dostawcy (i usuń stary).
2. Podmień go **wszędzie**, gdzie był: Netlify (zmienne środowiskowe → potem Deploys → Trigger deploy) i/lub GitHub (Secrets).

---

## Kontakty do pomocy technicznej dostawców
- Supabase: supabase.com/support
- Netlify: answers.netlify.com
- Stripe: dashboard.stripe.com → „?” → Contact support
- Resend: resend.com/help
- API-Football: dashboard.api-football.com → Support
- Anthropic: support.anthropic.com
