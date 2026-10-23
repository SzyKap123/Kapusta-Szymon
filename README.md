# Typy AI — serwis z typami piłkarskimi generowanymi przez AI

Polski serwis, w którym codziennie o 9:00 automatycznie pojawiają się typy (kupon dnia o kursie ok. 2.0 i kilka
typów pojedynczych) wygenerowane przez Claude na podstawie danych z API-Football. Typy rozliczają się same,
a statystyki (trafność, yield, pełna historia) są publiczne i niezmienne.

**Dla właściciela:**
- 🚀 Uruchomienie krok po kroku: [docs/INSTRUKCJA-URUCHOMIENIA.md](docs/INSTRUKCJA-URUCHOMIENIA.md)
- 🛟 Gdy coś nie działa: [docs/CO-ZROBIC-GDY-COS-NIE-DZIALA.md](docs/CO-ZROBIC-GDY-COS-NIE-DZIALA.md)
- 💳 Wiadomość do Stripe: [docs/wiadomosc-do-stripe.md](docs/wiadomosc-do-stripe.md)

## Architektura

| Część | Technologia | Koszt |
|---|---|---|
| Strona, logowanie, płatności, panel | Next.js 16 na Netlify | 0 zł |
| Baza danych i konta | Supabase (Postgres + Auth) | 0 zł |
| Codzienne zadania (generowanie 9:00, rozliczanie co 3 h, strażnik) | GitHub Actions (`.github/workflows/zadania.yml`) | 0 zł |
| Dane sportowe | API-Football (plan darmowy) | 0 zł |
| AI | Claude API (Haiku 5.5) | grosze dziennie |
| E-maile | Resend | 0 zł |
| Płatności | Stripe Checkout + Customer Portal | prowizja |

Najważniejsze pliki:
- `src/lib/jobs/generate.ts` — codzienne generowanie (pobranie danych → AI → walidacja → publikacja → e-maile)
- `src/lib/ai/` — prompt, schemat odpowiedzi i walidacja (kursy zawsze z danych, filtr słów zakazanych)
- `src/lib/settlement.ts`, `src/lib/jobs/settle.ts` — rozliczanie
- `src/lib/payments/` — Stripe (zgoda na treść cyfrową, webhooki, ewidencja)
- `supabase/schema.sql` — baza, w tym wyzwalacze blokujące edycję/usuwanie opublikowanych typów

## Programista

```bash
npm install
npm test             # testy (generowanie, rozliczanie, płatności)
DEMO_MODE=1 npm run dev   # podgląd z przykładowymi danymi, bez kont
npm run job -- generate --force   # ręczne generowanie (wymaga zmiennych z .env.example)
```

Stara strona „Komis samochodowy” została przeniesiona do folderu `komis-samochodowy/`.
