import Link from "next/link";
import type { Metadata } from "next";
import { loginAction } from "../actions";
import { AuthCard } from "@/components/AuthCard";
import { firstParam } from "@/components/Notice";
import { config } from "@/lib/config";

export const metadata: Metadata = { title: "Logowanie" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const next = firstParam(sp.next) ?? "/konto";

  if (config.demoMode) {
    return (
      <AuthCard title="Logowanie (demo)" info="W trybie demonstracyjnym wybierz konto przykładowe.">
        <form action={loginAction} className="space-y-3">
          <input type="hidden" name="next" value={next} />
          <button name="demo" value="user" className="btn-primary w-full">Wejdź jako subskrybent</button>
          <button name="demo" value="admin" className="btn-ghost w-full">Wejdź jako administrator</button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Logowanie" error={firstParam(sp.blad)} info={firstParam(sp.info)}>
      <form action={loginAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Hasło</label>
          <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <button className="btn-primary w-full">Zaloguj się</button>
      </form>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <Link href="/reset-hasla" className="text-brand underline">Nie pamiętam hasła</Link>
        <Link href="/rejestracja" className="text-brand underline">Załóż konto</Link>
      </div>
    </AuthCard>
  );
}
