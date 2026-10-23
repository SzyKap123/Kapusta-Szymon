import Link from "next/link";
import type { Metadata } from "next";
import { registerAction } from "../actions";
import { AuthCard } from "@/components/AuthCard";
import { firstParam } from "@/components/Notice";

export const metadata: Metadata = { title: "Rejestracja" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return (
    <AuthCard title="Załóż konto" error={firstParam(sp.blad)}>
      <form action={registerAction} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Hasło (min. 8 znaków)</label>
          <input className="input" id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
        </div>
        <label className="flex gap-3 text-sm">
          <input type="checkbox" name="adult" required className="mt-1 h-4 w-4 shrink-0 accent-emerald-500" />
          <span>
            <strong>Oświadczam, że mam ukończone 18 lat.</strong> Rozumiem, że typy są generowane przez AI, stanowią
            wyłącznie opinię i nie gwarantują wygranej, a hazard może uzależniać.
          </span>
        </label>
        <label className="flex gap-3 text-sm">
          <input type="checkbox" name="terms" required className="mt-1 h-4 w-4 shrink-0 accent-emerald-500" />
          <span>
            Akceptuję <Link href="/regulamin" className="text-brand underline">regulamin</Link> i zapoznałem/-am się z{" "}
            <Link href="/polityka-prywatnosci" className="text-brand underline">polityką prywatności</Link>.
          </span>
        </label>
        <button className="btn-primary w-full">Załóż konto</button>
      </form>
      <p className="text-sm text-muted">
        Masz już konto? <Link href="/logowanie" className="text-brand underline">Zaloguj się</Link>
      </p>
    </AuthCard>
  );
}
