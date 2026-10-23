import { HELP_LINE } from "../config";
import { formatDatePl } from "../time";
import type { Coupon } from "../types";
import { escapeHtml, type EmailMessage } from "./resend";

const DISCLAIMER = `Typy są generowane przez sztuczną inteligencję i stanowią wyłącznie opinię — nie gwarantują wygranej.
Hazard może uzależniać. Tylko dla osób 18+. Pomoc: telefon zaufania ${HELP_LINE.phone} (${HELP_LINE.hours}), ${HELP_LINE.websiteLabel}.`;

function layout(siteName: string, body: string, footerExtra = ""): string {
  return `<!doctype html><html lang="pl"><body style="margin:0;background:#f4f6f8;font-family:Arial,sans-serif;color:#0f172a">
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="background:#ffffff;border-radius:12px;padding:24px">
<h1 style="margin:0 0 16px;font-size:20px;color:#047857">${escapeHtml(siteName)}</h1>
${body}
</div>
<p style="font-size:12px;color:#64748b;line-height:1.5;margin-top:16px">${escapeHtml(DISCLAIMER)}${footerExtra}</p>
</div></body></html>`;
}

export function newTipsEmail(to: string, siteName: string, siteUrl: string, date: string, coupons: Coupon[]): EmailMessage {
  const cod = coupons.find((c) => c.kind === "coupon_of_day");
  const singles = coupons.filter((c) => c.kind === "single").length;
  const body = `<p>Nowe typy na <strong>${escapeHtml(formatDatePl(date))}</strong> są już dostępne.</p>
<ul style="line-height:1.7">
${cod ? `<li>Kupon dnia — kurs ok. ${cod.totalOdds.toFixed(2)} (${cod.picks.length} zdarzenia)</li>` : ""}
<li>Typy pojedyncze: ${singles}</li>
</ul>
<p><a href="${siteUrl}" style="display:inline-block;background:#059669;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Zobacz dzisiejsze typy</a></p>`;
  return {
    to,
    subject: `Nowe typy na ${formatDatePl(date)}`,
    html: layout(
      siteName,
      body,
      `<br><br>Otrzymujesz tę wiadomość, ponieważ masz aktywną subskrypcję. Subskrypcję możesz anulować w każdej chwili na stronie <a href="${siteUrl}/konto">Moje konto</a>.`,
    ),
  };
}

export function adminAlertEmail(to: string, siteName: string, subject: string, details: string): EmailMessage {
  return {
    to,
    subject: `[${siteName}] ${subject}`,
    html: `<!doctype html><html><body style="font-family:Arial,sans-serif">
<h2 style="color:#b91c1c">${escapeHtml(subject)}</h2>
<pre style="white-space:pre-wrap;background:#f1f5f9;padding:12px;border-radius:8px">${escapeHtml(details)}</pre>
<p>Co zrobić: otwórz plik <strong>docs/CO-ZROBIC-GDY-COS-NIE-DZIALA.md</strong> w repozytorium lub panel administratora.</p>
</body></html>`,
  };
}

export function purchaseConfirmationEmail(
  to: string,
  o: { siteName: string; siteUrl: string; operatorName: string; operatorAddress: string; contactEmail: string },
  p: { kind: "coupon" | "subscription"; description: string; amountCents: number; occurredAt: string; consentText: string },
): EmailMessage {
  const amount = new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(p.amountCents / 100);
  const body = `<p>Dziękujemy za zakup. Potwierdzamy zawarcie umowy o dostarczanie treści cyfrowych.</p>
<table style="font-size:14px;line-height:1.6">
<tr><td style="padding-right:12px;color:#64748b">Przedmiot</td><td>${escapeHtml(p.description)}</td></tr>
<tr><td style="padding-right:12px;color:#64748b">Cena</td><td>${amount}${p.kind === "subscription" ? " / miesiąc (odnawiana do czasu anulowania)" : ""}</td></tr>
<tr><td style="padding-right:12px;color:#64748b">Data</td><td>${escapeHtml(new Date(p.occurredAt).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" }))}</td></tr>
<tr><td style="padding-right:12px;color:#64748b">Sprzedawca</td><td>${escapeHtml(o.operatorName)}, ${escapeHtml(o.operatorAddress)}, ${escapeHtml(o.contactEmail)}</td></tr>
</table>
<p style="font-size:13px;background:#f1f5f9;padding:10px;border-radius:8px"><strong>Złożone oświadczenie:</strong> ${escapeHtml(p.consentText)}</p>
${p.kind === "subscription" ? `<p style="font-size:13px">Subskrypcję możesz anulować w każdej chwili na stronie <a href="${o.siteUrl}/konto">Moje konto</a>.</p>` : ""}
<p style="font-size:13px">Regulamin: <a href="${o.siteUrl}/regulamin">${o.siteUrl}/regulamin</a></p>`;
  return { to, subject: `Potwierdzenie zakupu — ${o.siteName}`, html: layout(o.siteName, body) };
}
