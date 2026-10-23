import type { Metadata } from "next";
import { updatePasswordAction } from "../actions";
import { AuthCard } from "@/components/AuthCard";
import { firstParam } from "@/components/Notice";

export const metadata: Metadata = { title: "Nowe hasło" };

export default async function NewPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return (
    <AuthCard title="Ustaw nowe hasło" error={firstParam(sp.blad)}>
      <form action={updatePasswordAction} className="space-y-4">
        <div>
          <label className="label" htmlFor="password">Nowe hasło (min. 8 znaków)</label>
          <input className="input" id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
        </div>
        <button className="btn-primary w-full">Zapisz hasło</button>
      </form>
    </AuthCard>
  );
}
