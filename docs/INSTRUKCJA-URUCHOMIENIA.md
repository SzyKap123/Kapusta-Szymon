# Instrukcja uruchomienia — krok po kroku

Ta instrukcja prowadzi Cię przez wszystko, czego nie da się zrobić automatycznie: zakładanie kont,
kopiowanie kluczy i podłączenie domeny. Zajmie to ok. 2–3 godziny. Rób kroki **po kolei**.

**Zasada bezpieczeństwa:** klucze (długie ciągi znaków typu `sk_...`, `re_...`) są jak hasła.
Wklejasz je **tylko** w ustawieniach Netlify i GitHub — nigdy do kodu, e-maila ani czatu.

Przygotuj sobie notatnik (np. plik na komputerze), w którym na chwilę zapiszesz klucze, a po skończeniu go usuń.

---

## Krok 0. Połącz kod z gałęzią główną (main)

Kod jest na gałęzi `claude/ai-sports-betting-service-v6wq4l`. Hosting i zadania automatyczne działają z gałęzi `main`.

1. Wejdź na github.com → Twoje repozytorium → zakładka **Pull requests**.
2. Otwórz pull request z tej gałęzi (lub kliknij **Compare & pull request**).
3. Kliknij **Merge pull request** → **Confirm merge**.

(Możesz też poprosić mnie, Claude, o przygotowanie pull requesta.)

---

## Krok 1. Domena (ok. 5–100 zł / rok)

1. Kup domenę `.pl` u dowolnego rejestratora (np. OVH, home.pl, nazwa.pl). W pierwszym roku często jest w promocji.
2. Zapamiętaj, gdzie zarządzasz **DNS** domeny (w panelu rejestratora) — będzie potrzebne w krokach 3 i 7.

---

## Krok 2. Supabase — baza danych i konta użytkowników (0 zł)

1. Wejdź na **supabase.com** → **Start your project** → zaloguj się kontem GitHub.
2. **New project**: nazwa dowolna, ustaw silne hasło bazy (zapisz), **Region: Central EU (Frankfurt)**. Plan **Free**.
3. Poczekaj ok. 2 minuty, aż projekt się utworzy.
4. W menu po lewej: **SQL Editor** → **New query**. Otwórz w repozytorium plik `supabase/schema.sql`,
   skopiuj **całą** zawartość, wklej i kliknij **Run**. Powinno pojawić się „Success”.
5. **Project Settings** (zębatka) → **API Keys** (lub „Data API”). Zapisz:
   - **Project URL** (np. `https://abcd.supabase.co`) → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** (`sb_publishable_...`; w starszych projektach „anon public”) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **Secret key** (`sb_secret_...`; w starszych „service_role”) → `SUPABASE_SECRET_KEY` ⚠️ najważniejszy klucz — nikomu go nie pokazuj.
6. **Authentication** → **URL Configuration**:
   - **Site URL**: `https://twojadomena.pl`
   - **Redirect URLs** → Add URL: `https://twojadomena.pl/**`
7. **Authentication** → **Emails** → **Templates**: wklej polskie szablony z pliku `docs/szablony-email-supabase.md`.
8. (SMTP ustawisz w kroku 3.)

---

## Krok 3. Resend — wysyłka e-maili (0 zł do 3000 e-maili/mies.)

1. Wejdź na **resend.com** → **Sign up**.
2. **Domains** → **Add domain** → wpisz swoją domenę, region **EU (Ireland)**.
3. Resend pokaże kilka rekordów DNS (TXT, MX). Wejdź do panelu rejestratora domeny → DNS → dodaj każdy rekord
   dokładnie tak, jak podaje Resend. Wróć do Resend i kliknij **Verify** (może to potrwać do kilku godzin).
4. **API Keys** → **Create API key** (uprawnienie „Sending access”) → zapisz jako `RESEND_API_KEY`.
5. Nadawca e-maili: `EMAIL_FROM` = np. `Typy AI <typy@twojadomena.pl>`.
6. Podłącz Resend do Supabase, żeby działały e-maile z potwierdzeniem konta i resetem hasła:
   Supabase → **Authentication** → **Emails** → **SMTP Settings** → **Enable custom SMTP**:
   - Sender email: `typy@twojadomena.pl`, Sender name: `Typy AI`
   - Host: `smtp.resend.com`, Port: `465`, Username: `resend`, Password: Twój `RESEND_API_KEY`
   - **Save**.

---

## Krok 4. API-Football — dane o meczach (0 zł, 100 zapytań dziennie)

1. Wejdź na **dashboard.api-football.com** → **Register** (plan **Free**, karta nie jest potrzebna).
2. Po zalogowaniu: **Account** → **My Access** → skopiuj **API Key** → `API_FOOTBALL_KEY`.
3. ⚠️ Po pierwszym uruchomieniu (krok 9) sprawdzimy, czy darmowy plan obejmuje bieżący sezon. Jeśli nie — w e-mailu
   z błędem zobaczysz komunikat „Free plans do not have access to this season”. Wtedy napisz do mnie (Claude),
   a dodam darmowe źródło zastępcze.

---

## Krok 5. Anthropic — AI generujące typy (ok. 20 zł jednorazowo, wystarcza na miesiące)

1. Wejdź na **console.anthropic.com** → załóż konto.
2. **Billing** → **Buy credits** → minimum 5 USD. **Nie włączaj** automatycznego doładowania (auto-reload).
3. **Limits** → ustaw miesięczny limit wydatków, np. 5 USD — wtedy nigdy nie zapłacisz więcej.
4. **API Keys** → **Create Key** → zapisz jako `ANTHROPIC_API_KEY`.

Używany jest najtańszy model (Claude Haiku 5.5) — jedno generowanie dziennie kosztuje ułamki grosza.
Mocniejszy model można włączyć zmienną `ANTHROPIC_MODEL` (np. `claude-opus-5-5`) — koszt wzrośnie do kilku-kilkunastu zł/mies.

---

## Krok 6. Stripe — płatności (0 zł stałych, prowizja od transakcji)

1. Wejdź na **stripe.com** → **Start now**. Kraj: **Polska**. Typ działalności: **Individual / osoba fizyczna**.
2. Uzupełnij weryfikację (dowód osobisty, rachunek bankowy). Opis działalności — jak w `docs/wiadomosc-do-stripe.md`.
3. **Najpierw wyślij wiadomość z pliku `docs/wiadomosc-do-stripe.md`** i poczekaj na pisemne potwierdzenie.
4. Na razie pracuj w **trybie testowym** (przełącznik „Test mode” / „Sandbox” w panelu).
5. **Settings → Payment methods**: włącz **Cards**, **BLIK**, **Przelewy24**.
6. **Settings → Billing → Customer portal**: włącz „Customers can cancel subscriptions” i wybierz
   anulowanie **na koniec okresu rozliczeniowego** („At the end of the billing period”), włącz historię faktur, ustaw link do regulaminu
   i polityki prywatności → **Save**. (Bez tego przycisk „Anuluj subskrypcję” nie zadziała.)
7. **Settings → Business → Customer emails**: włącz e-maile z potwierdzeniem płatności (receipts).
8. **Developers → API keys** → skopiuj **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY`.
9. **Developers → Webhooks** → **Add endpoint**:
   - URL: `https://twojadomena.pl/api/stripe/webhook`
   - Zdarzenia (Select events): `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
     `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`,
     `invoice.paid`, `charge.refunded`
   - Po zapisaniu skopiuj **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`.

---

## Krok 7. Netlify — hosting strony (0 zł)

1. Wejdź na **netlify.com** → **Sign up** → **with GitHub**.
2. **Add new project** → **Import an existing project** → **GitHub** → wybierz repozytorium → gałąź **main**.
   Ustawienia budowania wykryją się same (plik `netlify.toml`). **Nie klikaj jeszcze Deploy** — najpierw zmienne:
3. **Environment variables** → dodaj (Add variable) każdą z listy:

| Nazwa | Wartość |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://twojadomena.pl` |
| `NEXT_PUBLIC_SITE_NAME` | nazwa serwisu, np. `Typy AI` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Twój e-mail kontaktowy |
| `NEXT_PUBLIC_OPERATOR_NAME` | Twoje imię i nazwisko (wymagane w regulaminie) |
| `NEXT_PUBLIC_OPERATOR_ADDRESS` | adres do doręczeń |
| `ADMIN_EMAIL` | e-mail, którym zalogujesz się jako administrator |
| `NEXT_PUBLIC_SUPABASE_URL` | z kroku 2 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | z kroku 2 |
| `SUPABASE_SECRET_KEY` | z kroku 2 |
| `STRIPE_SECRET_KEY` | z kroku 6 |
| `STRIPE_WEBHOOK_SECRET` | z kroku 6 |
| `RESEND_API_KEY` | z kroku 3 |
| `EMAIL_FROM` | z kroku 3 |
| `COUPON_PRICE_PLN` | np. `9` (opcjonalnie) |
| `SUBSCRIPTION_PRICE_PLN` | np. `39` (opcjonalnie) |

4. **Deploy**. Po 2–3 minutach strona działa pod adresem `coś.netlify.app`.
5. **Domain management** → **Add a domain** → wpisz swoją domenę → Netlify pokaże rekordy DNS (zwykle
   `A` i `CNAME`) → dodaj je u rejestratora. Certyfikat HTTPS włączy się sam (do 24 h).

---

## Krok 8. GitHub — codzienne zadania automatyczne (0 zł)

1. github.com → repozytorium → **Settings** → **Secrets and variables** → **Actions**.
2. Zakładka **Secrets** → **New repository secret** — dodaj:

| Nazwa | Wartość |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | jak w Netlify |
| `SUPABASE_SECRET_KEY` | jak w Netlify |
| `API_FOOTBALL_KEY` | z kroku 4 |
| `ANTHROPIC_API_KEY` | z kroku 5 |
| `RESEND_API_KEY` | jak w Netlify |
| `EMAIL_FROM` | jak w Netlify |
| `ADMIN_EMAIL` | Twój e-mail — tu przychodzą alarmy |
| `NEXT_PUBLIC_SITE_URL` | `https://twojadomena.pl` |

3. (Opcjonalnie) zakładka **Variables**: `NEXT_PUBLIC_SITE_NAME`, `COUPON_PRICE_PLN`, `LEAGUE_IDS`, `ANTHROPIC_MODEL`.
4. Zakładka **Actions** (u góry repozytorium) → jeśli widzisz przycisk „I understand… enable” — kliknij go.

---

## Krok 9. Sprawdzenie, że wszystko działa

1. Otwórz swoją stronę → **Zaloguj** → **Załóż konto** e-mailem z `ADMIN_EMAIL` → potwierdź link z e-maila.
   Po zalogowaniu w nagłówku zobaczysz przycisk **Panel**.
2. Pierwsze typy: GitHub → **Actions** → **Zadania automatyczne** → **Run workflow** → job: `generate`,
   zaznacz **force** → **Run workflow**. Po 3–5 minutach (darmowe API ma limit 10 zapytań/min) typy pojawią się na stronie.
   Jeśli coś pójdzie nie tak, dostaniesz e-mail z opisem błędu.
3. Test płatności (tryb testowy Stripe): załóż drugie konto, kliknij **Odblokuj** przy płatnym kuponie, zaznacz
   zgodę, zapłać kartą testową **4242 4242 4242 4242**, data dowolna w przyszłości, CVC `123`.
   Kupon powinien się odblokować, a w panelu pojawi się przychód. Przetestuj też subskrypcję i jej anulowanie.
4. Od jutra typy pojawiają się same ok. 9:00, a wyniki rozliczają się co 3 godziny.

## Krok 10. Przed przyjęciem prawdziwych pieniędzy

- [ ] Masz pisemne potwierdzenie od Stripe (krok 6.3).
- [ ] Prawnik sprawdził regulamin, politykę prywatności i cookies (są oznaczone jako wersje robocze).
- [ ] Uzupełniłeś dane w `NEXT_PUBLIC_OPERATOR_NAME` / `NEXT_PUBLIC_OPERATOR_ADDRESS`.
- [ ] W Stripe wyłącz tryb testowy, skopiuj klucz **live** (`sk_live_...`), utwórz webhook w trybie live
      (te same zdarzenia) i podmień `STRIPE_SECRET_KEY` oraz `STRIPE_WEBHOOK_SECRET` w Netlify → **Deploys** → **Trigger deploy**.
- [ ] Wiesz, gdzie jest licznik limitu kwartalnego (Panel) i co robić po jego przekroczeniu (rejestracja w CEIDG w ciągu 7 dni).

---

## Tryb demonstracyjny (podgląd bez kont)

Ustaw w Netlify jedną zmienną `DEMO_MODE` = `1` (i nic więcej), a strona pokaże przykładowe dane.
Przed prawdziwym startem **usuń** tę zmienną.
