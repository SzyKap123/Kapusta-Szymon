import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { config } from "@/lib/config";

const NAV = [
  { href: "/", label: "Dziś" },
  { href: "/historia", label: "Historia" },
  { href: "/statystyki", label: "Statystyki" },
  { href: "/cennik", label: "Cennik" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm text-slate-950">AI</span>
          <span>{config.siteName}</span>
          <span className="rounded border border-line px-1.5 py-0.5 text-[10px] font-semibold text-muted">18+</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user?.isAdmin && (
            <Link href="/admin" className="btn-ghost px-3 py-2">
              Panel
            </Link>
          )}
          {user ? (
            <Link href="/konto" className="btn-ghost px-3 py-2">
              Konto
            </Link>
          ) : (
            <Link href="/logowanie" className="btn-primary px-3 py-2">
              Zaloguj
            </Link>
          )}
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-surface hover:text-ink">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
