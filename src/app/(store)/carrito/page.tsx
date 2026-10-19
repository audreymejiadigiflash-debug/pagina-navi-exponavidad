import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { getCartProducts } from "@/lib/cart-catalog";
import { getStoreSettings } from "@/lib/catalog";
import { isCheckoutConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Carrito",
  robots: { index: false },
};

export default async function CartPage() {
  const [products, settings] = await Promise.all([getCartProducts(), getStoreSettings()]);
  return (
    <div className="container-page py-12 md:py-16">
      <h1 className="mb-10 text-center text-[2.75rem] md:text-[3.5rem]">Tu carrito</h1>
      <CartView
        products={products}
        shipping={{
          shippingFlatCents: settings.shippingFlatCents,
          freeShippingThresholdCents: settings.freeShippingThresholdCents,
        }}
        checkoutEnabled={isCheckoutConfigured()}
      />
    </div>
  );
}
