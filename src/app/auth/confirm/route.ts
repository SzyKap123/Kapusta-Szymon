import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabase } from "@/lib/auth";

// Link z e-maila (potwierdzenie konta, reset hasła). Szablony e-maili Supabase
// kierują tutaj z parametrami token_hash i type (instrukcja w docs/).
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/konto";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/konto";

  const supabase = await getSupabase();
  let ok = false;
  if (tokenHash && type) ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  else if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;

  const target = new URL(ok ? next : "/logowanie", url.origin);
  if (!ok) target.searchParams.set("blad", "Link wygasł lub jest nieprawidłowy. Spróbuj ponownie.");
  else if (type === "signup" || type === "email") target.searchParams.set("info", "Konto zostało potwierdzone. Witamy!");
  return NextResponse.redirect(target);
}
