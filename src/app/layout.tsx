import type { Metadata, Viewport } from "next";
import { CookieBanner } from "@/components/CookieBanner";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { config } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${config.siteName} — typy piłkarskie generowane przez AI`, template: `%s | ${config.siteName}` },
  description:
    "Codzienne typy piłkarskie generowane przez sztuczną inteligencję na podstawie danych. Pełna, jawna historia i statystyki. Tylko dla osób 18+.",
  metadataBase: new URL(config.siteUrl),
};

export const viewport: Viewport = { themeColor: "#0b1220", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="flex min-h-screen flex-col">
        {config.demoMode && (
          <div className="bg-warn px-4 py-1.5 text-center text-xs font-semibold text-slate-950">
            TRYB DEMONSTRACYJNY — przykładowe dane, płatności i logowanie wyłączone
          </div>
        )}
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
        <SiteFooter />
        <CookieBanner />
      </body>
    </html>
  );
}
