"use client";

import Image from "next/image";
import Link from "next/link";
import { ShieldIcon } from "@/components/icons";
import { formatPrice } from "@/lib/format";
import { effectivePriceCents } from "@/lib/pricing";
import { variantKindName } from "@/lib/variants";
import { cartActions } from "./cart-store";
import type { CartProduct, ShippingRules } from "./cart-types";
import { OrderSummary } from "./order-summary";
import { QuantityStepper } from "./quantity-stepper";
import { useCartSummary } from "./use-cart-summary";

type CartViewProps = {
  products: CartProduct[];
  shipping: ShippingRules;
  checkoutEnabled: boolean;
};

export function CartView({ products, shipping, checkoutEnabled }: CartViewProps) {
  const summary = useCartSummary(products, shipping);

  if (!summary.hydrated) {
    return <div className="h-64 animate-pulse bg-ivory" aria-busy="true" aria-label="Cargando tu carrito" />;
  }

  if (!summary.lines.length) {
    return (
      <div className="border border-line px-6 py-20 text-center">
        <h2 className="text-[2rem]">Tu carrito está vacío</h2>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">
          Descubre nuestros árboles, esferas y luces para empezar a vestir tu hogar.
        </p>
        <Link href="/tienda" className="btn btn-primary mt-8">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-14">
      <section aria-label="Productos en tu carrito">
        <ul className="border-t border-line">
          {summary.lines.map(({ product, quantity, maxQuantity, lineTotalCents }) => (
            <li key={product.key} className="grid grid-cols-[96px_1fr] gap-5 border-b border-line py-6 md:grid-cols-[120px_1fr_auto]">
              <Link href={`/producto/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-ivory">
                {product.imageUrl ? (
                  <Image src={product.imageUrl} alt="" fill sizes="120px" className="object-cover" />
                ) : null}
              </Link>
              <div className="flex min-w-0 flex-col">
                <p className="label-caps text-[0.625rem] text-ink-soft">{product.categoryName}</p>
                <h3 className="mt-1 font-sans text-[1rem] font-normal leading-snug">
                  <Link href={`/producto/${product.slug}`} className="hover:underline hover:underline-offset-4">
                    {product.name}
                  </Link>
                </h3>
                {product.variantLabel ? (
                  <p className="mt-1 text-[0.875rem] text-ink">
                    {variantKindName([product.variantLabel])}: {product.variantLabel}
                  </p>
                ) : null}
                <p className="mt-1 text-[0.875rem] text-ink-soft">{formatPrice(effectivePriceCents(product))} c/u</p>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <QuantityStepper
                    size="sm"
                    value={quantity}
                    max={maxQuantity}
                    onChange={(value) => cartActions.setQuantity(product.key, value)}
                    label={`Cantidad de ${product.name}${product.variantLabel ? ` (${product.variantLabel})` : ""}`}
                  />
                  <button
                    type="button"
                    className="label-caps min-h-10 text-[0.6875rem] text-ink-soft underline underline-offset-4 hover:text-error"
                    onClick={() => cartActions.remove(product.key)}
                  >
                    Eliminar
                  </button>
                </div>
                {quantity >= maxQuantity && product.stock <= maxQuantity ? (
                  <p className="mt-2 text-[0.8125rem] text-ink-soft">Máximo disponible: {maxQuantity}.</p>
                ) : null}
                <p className="mt-4 text-[0.95rem] md:hidden">{formatPrice(lineTotalCents)}</p>
              </div>
              <p className="hidden text-[1rem] md:block">{formatPrice(lineTotalCents)}</p>
            </li>
          ))}
        </ul>
        <Link href="/tienda" className="label-caps link-underline mt-8 inline-block text-[0.6875rem]">
          Seguir comprando
        </Link>
      </section>

      <aside className="lg:sticky lg:top-[200px] lg:self-start">
        <OrderSummary
          subtotalCents={summary.subtotalCents}
          shippingCents={summary.shippingCents}
          totalCents={summary.totalCents}
          shipping={shipping}
        >
          {checkoutEnabled ? (
            <Link href="/checkout" className="btn btn-primary mt-8 w-full">
              Finalizar compra
            </Link>
          ) : (
            <p className="mt-8 border border-line bg-white px-4 py-3 text-[0.875rem] text-ink-soft" role="status">
              Las compras en línea estarán disponibles muy pronto.
            </p>
          )}
          <p className="mt-4 flex items-center justify-center gap-2 text-[0.8125rem] text-ink-soft">
            <ShieldIcon size={16} className="text-gold-ink" />
            Pago seguro con Mercado Pago
          </p>
        </OrderSummary>
      </aside>
    </div>
  );
}
