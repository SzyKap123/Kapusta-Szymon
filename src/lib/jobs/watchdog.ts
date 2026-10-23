import type { Repository } from "../db/repository";
import type { Mailer } from "../email/resend";
import { warsawDate, warsawHour } from "../time";
import { alertAdmin, PUBLISH_HOUR } from "./generate";

/** Godzina (czas polski), po której brak typów uznajemy za awarię. */
export const WATCHDOG_HOUR = PUBLISH_HOUR + 1;

/**
 * Strażnik: jeśli do 10:00 nie było udanego generowania (np. GitHub Actions
 * w ogóle się nie uruchomił), wysyła e-mail do administratora — raz dziennie.
 */
export async function runWatchdog(deps: {
  repo: Repository;
  mailer: Mailer;
  adminEmails: string[];
  siteName: string;
  now?: () => Date;
}): Promise<"ok" | "too_early" | "alerted" | "already_alerted"> {
  const now = deps.now?.() ?? new Date();
  if (warsawHour(now) < WATCHDOG_HOUR) return "too_early";
  const date = warsawDate(now);

  // Typy nierozliczone dłużej niż 3 dni po meczu — rozliczanie mogło przestać działać.
  const stale = (await deps.repo.listPendingPicks()).filter(
    (p) => now.getTime() - new Date(p.kickoff).getTime() > 72 * 3_600_000,
  );
  const staleKey = `watchdog_stale_${date}`;
  if (stale.length && !(await deps.repo.getSetting(staleKey))) {
    await deps.repo.setSetting(staleKey, now.toISOString());
    await alertAdmin(
      deps,
      "Typy czekają na rozliczenie ponad 3 dni",
      stale.map((p) => `${p.homeTeam} – ${p.awayTeam} (mecz ${p.fixtureId}, start ${p.kickoff})`).join("\n"),
    );
  }

  const runs = await deps.repo.runsForDate(date);
  if (runs.some((r) => ["success", "no_matches", "paused"].includes(r.status))) return "ok";

  const key = `watchdog_alert_${date}`;
  if (await deps.repo.getSetting(key)) return "already_alerted";
  await deps.repo.setSetting(key, now.toISOString());

  const details = runs.length
    ? runs.map((r) => `${r.startedAt} — ${r.status}: ${r.message ?? ""}`).join("\n")
    : "Brak jakiejkolwiek próby generowania dzisiaj. Sprawdź, czy GitHub Actions działa (zakładka Actions w repozytorium).";
  await alertAdmin(deps, `Brak typów na dziś (${date})`, details);
  return "alerted";
}
