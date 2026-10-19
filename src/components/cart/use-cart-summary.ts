"use client";

import { useEffect, useMemo } from "react";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/constants";
import { effectivePriceCents, shippingCentsFor } from "@/lib/pricing";
import { cartActions, cartLineKey, useCartHydrated, useCartLines } from "./cart-store";
import type { CartProduct, ShippingRules } from "./cart-types";

export type CartSummaryLine = {
  product: CartProduct;
  quantity: number;
  maxQuantity: number;
  lineTotalCents: number;
};

/** Joins the browser cart with current catalog data and computes totals. */
export function useCartSummary(products: CartProduct[], shipping: ShippingRules) {
  const lines = useCartLines();
  const hydrated = useCartHydrated();
  const productByKey = useMemo(() => new Map(products.map((product) => [product.key, product])), [products]);

  // Products removed from the catalog or sold out are dropped from the cart.
  useEffect(() => {
    if (!hydrated) return;
    const available = new Set(products.filter((product) => product.stock > 0).map((product) => product.key));
    cartActions.retain(available);
  }, [hydrated, products]);

  const summaryLines: CartSummaryLine[] = [];
  for (const line of lines) {
    const product = productByKey.get(cartLineKey(line));
    if (!product || product.stock <= 0) continue;
    const maxQuantity = Math.min(product.stock, MAX_QUANTITY_PER_ITEM);
    const quantity = Math.min(line.quantity, maxQuantity);
    summaryLines.push({ product, quantity, maxQuantity, lineTotalCents: effectivePriceCents(product) * quantity });
  }

  const subtotalCents = summaryLines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const shippingCents = shippingCentsFor(subtotalCents, shipping);
  const itemCount = summaryLines.reduce((sum, line) => sum + line.quantity, 0);

  return {
    hydrated,
    lines: summaryLines,
    itemCount,
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
  };
}
