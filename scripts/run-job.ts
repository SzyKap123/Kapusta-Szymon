// Uruchamiane przez GitHub Actions (plik .github/workflows/zadania.yml).
// Użycie: npx tsx scripts/run-job.ts generate|settle|watchdog [--force]

import { config } from "../src/lib/config";
import { getRepo } from "../src/lib/db";
import { alertAdmin, runGeneration } from "../src/lib/jobs/generate";
import { runSettlement } from "../src/lib/jobs/settle";
import { runWatchdog } from "../src/lib/jobs/watchdog";
import { getJobDeps, getMailer, getProvider } from "../src/lib/services";

async function main() {
  const [job, flag] = process.argv.slice(2);
  const force = flag === "--force";

  switch (job) {
    case "generate": {
      const result = await runGeneration(getJobDeps(), { force });
      console.log("Generowanie:", JSON.stringify(result));
      if (result.outcome === "failed") process.exitCode = 1;
      break;
    }
    case "settle": {
      try {
        const result = await runSettlement({ repo: getRepo(), provider: getProvider() });
        console.log("Rozliczanie:", JSON.stringify(result));
      } catch (e) {
        // Pojedynczy błąd rozliczenia nie jest pilny (kolejna próba za 3 h) — strażnik
        // wyśle e-mail, jeśli typy czekają zbyt długo.
        console.error("Błąd rozliczania:", e);
        process.exitCode = 1;
      }
      break;
    }
    case "watchdog": {
      const result = await runWatchdog({
        repo: getRepo(),
        mailer: getMailer(),
        adminEmails: config.adminEmails,
        siteName: config.siteName,
      });
      console.log("Strażnik:", result);
      break;
    }
    default:
      console.error("Nieznane zadanie. Użyj: generate | settle | watchdog");
      process.exitCode = 2;
  }
}

main().catch(async (e) => {
  console.error(e);
  await alertAdmin({ mailer: getMailer(), adminEmails: config.adminEmails, siteName: config.siteName }, "Błąd zadania automatycznego", String(e?.stack ?? e));
  process.exit(1);
});
