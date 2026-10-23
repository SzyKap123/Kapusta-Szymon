"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const COOKIE = "cookie_consent";

function readConsent(): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function saveConsent(value: "all" | "necessary") {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax; Secure`;
}

/**
 * Baner zgody na cookies. Obecnie serwis używa wyłącznie cookies niezbędnych
 * (logowanie, zapamiętanie tej decyzji). Opcjonalne narzędzia (np. statystyki)
 * wolno włączyć tylko, gdy zapisana zgoda ma wartość "all".
 */
export function CookieBanner() {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(readConsent() == null), []);
  if (!open) return null;

  const choose = (v: "all" | "necessary") => {
    saveConsent(v);
    setOpen(false);
  };

  return (
    <div role="dialog" aria-label="Zgoda na cookies" className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div className="mx-auto max-w-3xl rounded-2xl border border-line bg-surface-2 p-4 shadow-2xl">
        <p className="text-sm text-slate-300">
          Używamy plików cookies niezbędnych do działania serwisu (np. utrzymania logowania). Za Twoją zgodą możemy
          w przyszłości używać także cookies statystycznych. Szczegóły znajdziesz w{" "}
          <Link href="/polityka-cookies" className="text-brand underline">
            polityce cookies
          </Link>
          . Zgodę możesz w każdej chwili zmienić, usuwając cookies w przeglądarce.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={() => choose("all")}>
            Akceptuję wszystkie
          </button>
          <button type="button" className="btn-ghost" onClick={() => choose("necessary")}>
            Tylko niezbędne
          </button>
        </div>
      </div>
    </div>
  );
}
