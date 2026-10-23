// Wszystkie ustawienia pochodzą ze zmiennych środowiskowych — żadnych kluczy w kodzie.

function optional(name: string, fallback = ""): string {
  const v = process.env[name];
  return v == null || v === "" ? fallback : v;
}

export function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Brak zmiennej środowiskowej ${name}. Ustaw ją w panelu hostingu / GitHub Secrets.`);
  return v;
}

function plnToCents(value: string, fallback: number): number {
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : fallback;
}

export const config = {
  get siteName() {
    return optional("NEXT_PUBLIC_SITE_NAME", "Typy AI");
  },
  get siteUrl() {
    return optional("NEXT_PUBLIC_SITE_URL", "http://localhost:3000").replace(/\/$/, "");
  },
  get contactEmail() {
    return optional("NEXT_PUBLIC_CONTACT_EMAIL", "kontakt@example.com");
  },
  get adminEmails(): string[] {
    return optional("ADMIN_EMAIL")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  },
  get demoMode() {
    return optional("DEMO_MODE") === "1";
  },
  get couponPriceCents() {
    return plnToCents(optional("COUPON_PRICE_PLN", "9"), 900);
  },
  get subscriptionPriceCents() {
    return plnToCents(optional("SUBSCRIPTION_PRICE_PLN", "39"), 3900);
  },
  /** Limit przychodu działalności nierejestrowanej na kwartał (2026: 225% minimalnego wynagrodzenia). */
  get quarterlyLimitCents() {
    return plnToCents(optional("QUARTERLY_LIMIT_PLN", "10813.50"), 1_081_350);
  },
  get anthropicModel() {
    return optional("ANTHROPIC_MODEL", "claude-haiku-5-5");
  },
  /** ID lig w API-Football (domyślnie: Ekstraklasa, top 5 lig, puchary UEFA). */
  get leagueIds(): number[] {
    return optional("LEAGUE_IDS", "106,39,140,135,78,61,2,3,848")
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);
  },
  get apiFootballMinIntervalMs() {
    return Number(optional("API_FOOTBALL_MIN_INTERVAL_MS", "6500"));
  },
  get emailFrom() {
    return optional("EMAIL_FROM", "Typy AI <typy@example.com>");
  },
  /** Ile maksymalnie e-maili z powiadomieniem wysłać dziennie (darmowy Resend: 100/dzień). */
  get notifyDailyLimit() {
    return Number(optional("NOTIFY_DAILY_LIMIT", "90"));
  },
};

export const HELP_LINE = {
  phone: "801 889 880",
  hours: "codziennie 17:00–22:00",
  website: "https://www.uzaleznieniabehawioralne.pl",
  websiteLabel: "uzaleznieniabehawioralne.pl",
};
