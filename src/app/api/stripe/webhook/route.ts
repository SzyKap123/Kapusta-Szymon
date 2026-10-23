import { config, required } from "@/lib/config";
import { getRepo } from "@/lib/db";
import { purchaseConfirmationEmail } from "@/lib/email/templates";
import { DIGITAL_CONTENT_CONSENT } from "@/lib/payments/checkout";
import { getStripe } from "@/lib/payments/stripe";
import { processWebhook, type OnPurchase } from "@/lib/payments/webhook";
import { getMailer } from "@/lib/services";

// Adres do wpisania w Stripe: https://TWOJA-DOMENA/api/stripe/webhook
export async function POST(request: Request) {
  const repo = getRepo();
  const onPurchase: OnPurchase = async (p) => {
    const profile = await repo.getProfile(p.userId);
    if (!profile) return;
    await getMailer().send(
      purchaseConfirmationEmail(
        profile.email,
        {
          siteName: config.siteName,
          siteUrl: config.siteUrl,
          operatorName: process.env.NEXT_PUBLIC_OPERATOR_NAME ?? "",
          operatorAddress: process.env.NEXT_PUBLIC_OPERATOR_ADDRESS ?? "",
          contactEmail: config.contactEmail,
        },
        { ...p, consentText: DIGITAL_CONTENT_CONSENT },
      ),
    );
  };
  const body = await request.text();
  const res = await processWebhook(getStripe(), repo, body, request.headers.get("stripe-signature"), required("STRIPE_WEBHOOK_SECRET"), onPurchase);
  return new Response(res.body, { status: res.status });
}
