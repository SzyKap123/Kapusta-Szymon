import type { TipGenerator } from "../ai/claude";
import { buildCoupons } from "../ai/validate";
import type { Repository } from "../db/repository";
import { adminAlertEmail, newTipsEmail } from "../email/templates";
import type { Mailer } from "../email/resend";
import { couponContentHash } from "../hash";
import type { SportsDataProvider } from "../sports/types";
import { warsawDate, warsawHour } from "../time";

export const PUBLISH_HOUR = 9;
export const MAX_ATTEMPTS_PER_DAY = 3;
export const MAX_CANDIDATES = 25;
export const MIN_CANDIDATES = 5;
export const PAUSE_SETTING = "publishing_paused";

export interface JobDeps {
  repo: Repository;
  provider: SportsDataProvider;
  ai: TipGenerator;
  mailer: Mailer;
  siteName: string;
  siteUrl: string;
  adminEmails: string[];
  couponPriceCents: number;
  notifyDailyLimit: number;
  now?: () => Date;
}

export type GenerateResult =
  | { outcome: "too_early" | "already_done" | "attempts_exhausted" }
  | { outcome: "paused" | "no_matches" }
  | { outcome: "published"; coupons: number; warnings: string[] }
  | { outcome: "failed"; error: string };

export async function alertAdmin(deps: Pick<JobDeps, "mailer" | "adminEmails" | "siteName">, subject: string, details: string) {
  for (const to of deps.adminEmails) {
    try {
      await deps.mailer.send(adminAlertEmail(to, deps.siteName, subject, details));
    } catch (e) {
      console.error("Nie udało się wysłać alertu e-mail:", e);
    }
  }
}

export async function runGeneration(deps: JobDeps, opts: { force?: boolean } = {}): Promise<GenerateResult> {
  const now = deps.now?.() ?? new Date();
  const date = warsawDate(now);

  if (!opts.force && warsawHour(now) < PUBLISH_HOUR) return { outcome: "too_early" };

  const runs = await deps.repo.runsForDate(date);
  if (runs.some((r) => r.status === "success" || r.status === "no_matches" || r.status === "paused")) {
    return { outcome: "already_done" };
  }
  if (!opts.force && runs.filter((r) => r.status === "failed").length >= MAX_ATTEMPTS_PER_DAY) {
    return { outcome: "attempts_exhausted" };
  }

  const run = await deps.repo.startRun(date);

  if ((await deps.repo.getSetting(PAUSE_SETTING)) === "true") {
    await deps.repo.finishRun(run.id, "paused", "Publikacja wstrzymana w panelu administratora.");
    return { outcome: "paused" };
  }

  try {
    const all = await deps.provider.getCandidates(date, now);
    const candidates = all.slice(0, MAX_CANDIDATES);
    if (candidates.length < MIN_CANDIDATES) {
      await deps.repo.finishRun(run.id, "no_matches", `Za mało meczów z kursami (${candidates.length}). Dziś bez typów.`);
      return { outcome: "no_matches" };
    }

    let built = buildCoupons(await deps.ai.generate(date, candidates), candidates, {
      date,
      couponPriceCents: deps.couponPriceCents,
    });
    if (built.errors.length) {
      // Druga próba — modelowi odsyłamy listę błędów do poprawy.
      built = buildCoupons(await deps.ai.generate(date, candidates, built.errors.join("\n")), candidates, {
        date,
        couponPriceCents: deps.couponPriceCents,
      });
    }
    if (built.errors.length) throw new Error(`AI zwróciło nieprawidłowe typy:\n${built.errors.join("\n")}`);

    const publishedAt = new Date().toISOString();
    const published = await deps.repo.publishCoupons(
      built.coupons.map((input) => ({ input, contentHash: couponContentHash(input, publishedAt), publishedAt })),
    );

    const summary = `Opublikowano ${published.length} kuponów.${built.warnings.length ? ` Uwagi: ${built.warnings.join(" | ")}` : ""}`;
    await deps.repo.finishRun(run.id, "success", summary);

    await notifySubscribers(deps, date, published, now);
    return { outcome: "published", coupons: published.length, warnings: built.warnings };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await deps.repo.finishRun(run.id, "failed", error.slice(0, 2000));
    await alertAdmin(
      deps,
      "Nie udało się wygenerować typów",
      `Data: ${date}\nBłąd: ${error}\n\nSystem spróbuje ponownie przy kolejnym zaplanowanym uruchomieniu (maks. ${MAX_ATTEMPTS_PER_DAY} próby dziennie).`,
    );
    return { outcome: "failed", error };
  }
}

async function notifySubscribers(deps: JobDeps, date: string, coupons: Awaited<ReturnType<Repository["publishCoupons"]>>, now: Date) {
  try {
    const emails = await deps.repo.listActiveSubscriberEmails(now);
    const limited = emails.slice(0, deps.notifyDailyLimit);
    if (limited.length) {
      await deps.mailer.sendBatch(limited.map((to) => newTipsEmail(to, deps.siteName, deps.siteUrl, date, coupons)));
    }
    if (emails.length > limited.length) {
      await alertAdmin(
        deps,
        "Limit e-maili osiągnięty",
        `Subskrybentów: ${emails.length}, wysłano: ${limited.length}. Rozważ płatny plan Resend i zwiększ NOTIFY_DAILY_LIMIT.`,
      );
    }
  } catch (e) {
    await alertAdmin(deps, "Typy opublikowane, ale e-maile do subskrybentów nie zostały wysłane", String(e));
  }
}
