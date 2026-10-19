import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getCartProducts } from "@/lib/cart-catalog";
import { getStoreSettings } from "@/lib/catalog";
import { isCheckoutConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Finalizar compra",
  robots: { index: false },
};

export default async function CheckoutPage() {
  if (!isCheckoutConfigured()) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-[2.75rem]">Muy pronto podrás comprar en línea</h1>
        <p className="mx-auto mt-4 max-w-md text-ink-soft">
          Estamos terminando de configurar los pagos. Tus productos siguen guardados en el carrito.
        </p>
        <Link href="/carrito" className="btn btn-outline mt-8">
          Volver al carrito
        </Link>
      </div>
    );
  }

  const [products, settings] = await Promise.all([getCartProducts(), getStoreSettings()]);
  return (
    <div className="container-page py-12 md:py-16">
      <div className="mb-10 text-center">
        <span className="eyebrow">Pago seguro</span>
        <h1 className="mt-3 text-[2.75rem] md:text-[3.5rem]">Finalizar compra</h1>
      </div>
      <CheckoutForm
        products={products}
        shipping={{
          shippingFlatCents: settings.shippingFlatCents,
          freeShippingThresholdCents: settings.freeShippingThresholdCents,
        }}
      />
    </div>
  );
}
