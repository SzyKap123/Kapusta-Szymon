import Link from "next/link";
import { HELP_LINE } from "@/lib/config";

/** Krótka, wyraźna informacja o charakterze typów — wyświetlana przy typach. */
export function AiNotice() {
  return (
    <div className="rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-amber-100">
      <strong>Typy generuje sztuczna inteligencja (AI).</strong> To wyłącznie opinia, a nie porada ani gwarancja wygranej.
      Zakłady wiążą się z ryzykiem utraty pieniędzy, a hazard może uzależniać.{" "}
      <Link href="/odpowiedzialna-gra" className="underline">
        Pomoc dla osób z problemem hazardowym
      </Link>
      .
    </div>
  );
}

export function HelpLine() {
  return (
    <p>
      Potrzebujesz pomocy? Telefon zaufania uzależnień behawioralnych{" "}
      <a href={`tel:${HELP_LINE.phone.replace(/\s/g, "")}`} className="font-semibold text-ink underline">
        {HELP_LINE.phone}
      </a>{" "}
      ({HELP_LINE.hours}) oraz{" "}
      <a href={HELP_LINE.website} target="_blank" rel="noopener noreferrer" className="underline">
        {HELP_LINE.websiteLabel}
      </a>
      .
    </p>
  );
}
