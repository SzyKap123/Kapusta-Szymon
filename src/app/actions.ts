"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_COOKIE, getCurrentUser, getSupabase } from "@/lib/auth";
import { config } from "@/lib/config";
import { getRepo } from "@/lib/db";
import { PAUSE_SETTING } from "@/lib/jobs/generate";

const enc = encodeURIComponent;

function safeNext(v: FormDataEntryValue | null): string {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/konto";
}

export async function loginAction(form: FormData) {
  const next = safeNext(form.get("next"));
  if (config.demoMode) {
    (await cookies()).set(DEMO_COOKIE, form.get("demo") === "admin" ? "demo-admin" : "demo-user", { path: "/", httpOnly: true });
    redirect(next);
  }
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const supabase = await getSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const msg = /confirm/i.test(error.message)
      ? "Potwierdź adres e-mail, klikając link z wiadomości, którą wysłaliśmy."
      : "Nieprawidłowy e-mail lub hasło.";
    redirect(`/logowanie?blad=${enc(msg)}&next=${enc(next)}`);
  }
  redirect(next);
}

export async function registerAction(form: FormData) {
  if (config.demoMode) redirect("/logowanie");
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const adult = form.get("adult") === "on";
  const terms = form.get("terms") === "on";
  const fail = (m: string) => redirect(`/rejestracja?blad=${enc(m)}`);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Podaj prawidłowy adres e-mail.");
  if (password.length < 8) fail("Hasło musi mieć co najmniej 8 znaków.");
  if (!adult) fail("Serwis jest przeznaczony wyłącznie dla osób pełnoletnich. Potwierdź, że masz ukończone 18 lat.");
  if (!terms) fail("Aby założyć konto, zaakceptuj regulamin i politykę prywatności.");

  const supabase = await getSupabase();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${config.siteUrl}/auth/confirm?next=/konto`,
      data: { adult_confirmed: "true", terms_accepted: "true" },
    },
  });
  if (error) fail(/registered|exists/i.test(error.message) ? "Konto z tym adresem już istnieje." : "Nie udało się założyć konta. Spróbuj ponownie.");
  redirect("/logowanie?info=" + enc("Sprawdź skrzynkę e-mail i kliknij link, aby potwierdzić konto."));
}

export async function logoutAction() {
  if (config.demoMode) {
    (await cookies()).delete(DEMO_COOKIE);
    redirect("/");
  }
  const supabase = await getSupabase();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestResetAction(form: FormData) {
  if (config.demoMode) redirect("/logowanie");
  const email = String(form.get("email") ?? "").trim();
  const supabase = await getSupabase();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${config.siteUrl}/auth/confirm?next=/nowe-haslo` });
  // Zawsze ta sama odpowiedź — nie zdradzamy, czy konto istnieje.
  redirect("/reset-hasla?info=" + enc("Jeśli konto istnieje, wysłaliśmy link do ustawienia nowego hasła."));
}

export async function updatePasswordAction(form: FormData) {
  const password = String(form.get("password") ?? "");
  if (password.length < 8) redirect("/nowe-haslo?blad=" + enc("Hasło musi mieć co najmniej 8 znaków."));
  const supabase = await getSupabase();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/nowe-haslo?blad=" + enc("Link wygasł lub jest nieprawidłowy. Poproś o nowy link."));
  redirect("/konto?info=" + enc("Hasło zostało zmienione."));
}

export async function confirmAdultAction(form: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie");
  if (form.get("adult") !== "on") redirect("/konto?blad=" + enc("Zaznacz oświadczenie, aby kontynuować."));
  await getRepo().confirmAdult(user.id);
  redirect("/konto?info=" + enc("Dziękujemy, oświadczenie zostało zapisane."));
}

export async function togglePauseAction(form: FormData) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect("/");
  await getRepo().setSetting(PAUSE_SETTING, form.get("paused") === "true" ? "true" : "false");
  redirect("/admin");
}
