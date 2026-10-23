// Obsługa czasu polskiego (Europe/Warsaw), łącznie ze zmianą czasu letni/zimowy.

export const TIMEZONE = "Europe/Warsaw";

function parts(date: Date): Record<string, string> {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const out: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) out[p.type] = p.value;
  return out;
}

/** Data w Polsce w formacie YYYY-MM-DD. */
export function warsawDate(date: Date = new Date()): string {
  const p = parts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Godzina w Polsce (0–23). */
export function warsawHour(date: Date = new Date()): number {
  return Number(parts(date).hour);
}

/** Kwartał (1–4) i rok według czasu polskiego. */
export function warsawQuarter(date: Date = new Date()): { year: number; quarter: number } {
  const p = parts(date);
  return { year: Number(p.year), quarter: Math.floor((Number(p.month) - 1) / 3) + 1 };
}

/** Zakres dat (YYYY-MM-DD, włącznie) dla danego kwartału. */
export function quarterRange(year: number, quarter: number): { from: string; to: string } {
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = startMonth + 2;
  const lastDay = new Date(Date.UTC(year, endMonth, 0)).getUTCDate();
  const mm = (m: number) => String(m).padStart(2, "0");
  return { from: `${year}-${mm(startMonth)}-01`, to: `${year}-${mm(endMonth)}-${lastDay}` };
}

export function formatWarsaw(iso: string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat("pl-PL", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    ...opts,
  }).format(new Date(iso));
}

export function formatDatePl(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Intl.DateTimeFormat("pl-PL", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}
