import { ClaudeTipGenerator } from "./ai/claude";
import { config, required } from "./config";
import { getRepo } from "./db";
import { ConsoleMailer, ResendMailer, type Mailer } from "./email/resend";
import type { JobDeps } from "./jobs/generate";
import { ApiFootballProvider } from "./sports/apiFootball";

export function getMailer(): Mailer {
  const key = process.env.RESEND_API_KEY;
  return key ? new ResendMailer(key, config.emailFrom) : new ConsoleMailer();
}

export function getProvider() {
  return new ApiFootballProvider(required("API_FOOTBALL_KEY"), config.leagueIds, config.apiFootballMinIntervalMs);
}

export function getJobDeps(): JobDeps {
  return {
    repo: getRepo(),
    provider: getProvider(),
    ai: new ClaudeTipGenerator(required("ANTHROPIC_API_KEY"), config.anthropicModel),
    mailer: getMailer(),
    siteName: config.siteName,
    siteUrl: config.siteUrl,
    adminEmails: config.adminEmails,
    couponPriceCents: config.couponPriceCents,
    notifyDailyLimit: config.notifyDailyLimit,
  };
}
