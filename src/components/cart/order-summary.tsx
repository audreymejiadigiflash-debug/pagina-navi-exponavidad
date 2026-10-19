import { formatPrice } from "@/lib/format";
import type { ShippingRules } from "./cart-types";

type OrderSummaryProps = {
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  shipping: ShippingRules;
  children?: React.ReactNode;
};

export function OrderSummary({ subtotalCents, shippingCents, totalCents, shipping, children }: OrderSummaryProps) {
  const remainingForFree =
    shipping.freeShippingThresholdCents !== null && shippingCents > 0
      ? shipping.freeShippingThresholdCents - subtotalCents
      : 0;

  return (
    <div className="border border-line bg-ivory p-6 md:p-8">
      <h2 className="text-[1.75rem]">Resumen</h2>
      <dl className="mt-6 space-y-3 text-[0.95rem]">
        <div className="flex justify-between">
          <dt className="text-ink-soft">Subtotal</dt>
          <dd>{formatPrice(subtotalCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-soft">Envío</dt>
          <dd>{shippingCents === 0 ? "Gratis" : formatPrice(shippingCents)}</dd>
        </div>
        <div className="flex justify-between border-t border-line-strong pt-4 text-[1.05rem]">
          <dt className="font-medium">Total</dt>
          <dd className="font-medium">{formatPrice(totalCents)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-[0.8125rem] text-ink-soft">IVA incluido. Precios en pesos mexicanos.</p>
      {remainingForFree > 0 ? (
        <p className="mt-4 border-t border-line pt-4 text-[0.875rem] text-ink-soft">
          Te faltan <span className="text-ink">{formatPrice(remainingForFree)}</span> para obtener envío gratis.
        </p>
      ) : null}
      {children}
    </div>
  );
}
