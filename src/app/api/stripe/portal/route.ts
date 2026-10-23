import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { getRepo } from "@/lib/db";
import { getStripe } from "@/lib/payments/stripe";

// Panel klienta Stripe: anulowanie subskrypcji, zmiana karty, historia płatności.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/logowanie?next=/konto", config.siteUrl), 303);
  const profile = await getRepo().getProfile(user.id);
  if (config.demoMode || !profile?.stripeCustomerId) {
    return NextResponse.redirect(new URL("/konto?blad=" + encodeURIComponent("Brak danych płatności dla tego konta."), config.siteUrl), 303);
  }
  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripeCustomerId,
      return_url: `${config.siteUrl}/konto`,
      locale: "pl",
    });
    return NextResponse.redirect(session.url, 303);
  } catch (e) {
    console.error("Błąd panelu klienta Stripe", e);
    return NextResponse.redirect(
      new URL("/konto?blad=" + encodeURIComponent("Panel płatności jest chwilowo niedostępny. Napisz do nas, a anulujemy subskrypcję ręcznie."), config.siteUrl),
      303,
    );
  }
}
