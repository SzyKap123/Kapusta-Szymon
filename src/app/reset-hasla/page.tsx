import type { Metadata } from "next";
import { requestResetAction } from "../actions";
import { AuthCard } from "@/components/AuthCard";
import { firstParam } from "@/components/Notice";

export const metadata: Metadata = { title: "Reset hasła" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return (
    <AuthCard title="Reset hasła" info={firstParam(sp.info)}>
      <p className="text-sm text-muted">Podaj adres e-mail konta. Wyślemy link do ustawienia nowego hasła.</p>
      <form action={requestResetAction} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <button className="btn-primary w-full">Wyślij link</button>
      </form>
    </AuthCard>
  );
}
