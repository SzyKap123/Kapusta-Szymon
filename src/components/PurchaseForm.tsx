import { DIGITAL_CONTENT_CONSENT } from "@/lib/payments/checkout";

/** Formularz zakupu z obowiązkową zgodą na natychmiastowe dostarczenie treści cyfrowej. */
export function PurchaseForm({ kind, couponId, label }: { kind: "coupon" | "subscription"; couponId?: string; label: string }) {
  return (
    <form action="/api/stripe/checkout" method="post" className="space-y-3">
      <input type="hidden" name="kind" value={kind} />
      {couponId && <input type="hidden" name="couponId" value={couponId} />}
      <label className="flex gap-3 text-sm">
        <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 shrink-0 accent-emerald-500" />
        <span>{DIGITAL_CONTENT_CONSENT}</span>
      </label>
      <button className="btn-primary w-full sm:w-auto">{label}</button>
      <p className="text-xs text-muted">
        Płatność obsługuje Stripe (BLIK, karta, Przelewy24). Klikając przycisk, składasz zamówienie z obowiązkiem zapłaty.
      </p>
    </form>
  );
}
