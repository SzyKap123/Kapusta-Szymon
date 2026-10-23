import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { getRepo } from "@/lib/db";
import { CheckoutError, createCheckoutSession, validateCheckout, type CheckoutKind } from "@/lib/payments/checkout";
import { getStripe } from "@/lib/payments/stripe";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const kind: CheckoutKind = form.get("kind") === "subscription" ? "subscription" : "coupon";
  const couponId = typeof form.get("couponId") === "string" ? String(form.get("couponId")) : undefined;
  const back = kind === "coupon" && couponId ? `/kup/${couponId}` : "/cennik";
  const fail = (msg: string) => NextResponse.redirect(new URL(`${back}?blad=${encodeURIComponent(msg)}`, config.siteUrl), 303);

  if (config.demoMode) return fail("Płatności są wyłączone w trybie demo.");
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL(`/logowanie?next=${back}`, config.siteUrl), 303);

  const repo = getRepo();
  const profile = await repo.getProfile(user.id);
  const req = { kind, couponId, consent: form.get("consent") === "on" };
  try {
    const { coupon } = await validateCheckout(repo, profile, req);
    const url = await createCheckoutSession(
      { repo, stripe: getStripe(), siteUrl: config.siteUrl, siteName: config.siteName, subscriptionPriceCents: config.subscriptionPriceCents },
      profile!,
      req,
      coupon,
    );
    return NextResponse.redirect(url, 303);
  } catch (e) {
    if (e instanceof CheckoutError) return fail(e.message);
    console.error("Błąd tworzenia płatności", e);
    return fail("Nie udało się rozpocząć płatności. Spróbuj ponownie za chwilę.");
  }
}
