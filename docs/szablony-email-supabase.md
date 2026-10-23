# Szablony e-maili Supabase (po polsku)

Gdzie to wkleić: **Supabase → Authentication → Emails → Templates**.
Dla każdego szablonu podmień **Subject** i **Body** (wklej całość z ramki).

> Ważne: linki muszą prowadzić do `/auth/confirm` — tak jak poniżej. Nie zmieniaj fragmentów w `{{ }}`.

---

## Confirm signup (potwierdzenie rejestracji)

**Subject:** `Potwierdź swoje konto`

```html
<h2>Witaj!</h2>
<p>Dziękujemy za rejestrację. Kliknij poniższy link, aby potwierdzić adres e-mail:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/konto">Potwierdzam adres e-mail</a></p>
<p>Jeśli to nie Ty zakładałeś konto, zignoruj tę wiadomość.</p>
<p style="font-size:12px;color:#666">Serwis tylko dla osób 18+. Typy generuje AI i nie gwarantują wygranej. Hazard może uzależniać — pomoc: 801 889 880.</p>
```

## Reset Password (reset hasła)

**Subject:** `Ustaw nowe hasło`

```html
<h2>Reset hasła</h2>
<p>Otrzymaliśmy prośbę o zmianę hasła. Kliknij link, aby ustawić nowe hasło:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/nowe-haslo">Ustaw nowe hasło</a></p>
<p>Jeśli to nie Ty prosiłeś o zmianę, zignoruj tę wiadomość — hasło pozostanie bez zmian.</p>
```

## Change Email Address (zmiana adresu)

**Subject:** `Potwierdź nowy adres e-mail`

```html
<p>Kliknij link, aby potwierdzić zmianę adresu e-mail:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/konto">Potwierdzam nowy adres</a></p>
```
