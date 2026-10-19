import type { Product, StoreSettings } from "./types";

export function isOnSale(product: Pick<Product, "priceCents" | "salePriceCents">): boolean {
  return product.salePriceCents !== null && product.salePriceCents > 0 && product.salePriceCents < product.priceCents;
}

export function effectivePriceCents(product: Pick<Product, "priceCents" | "salePriceCents">): number {
  return isOnSale(product) ? (product.salePriceCents as number) : product.priceCents;
}

export function discountPercent(product: Pick<Product, "priceCents" | "salePriceCents">): number {
  if (!isOnSale(product)) return 0;
  return Math.round((1 - (product.salePriceCents as number) / product.priceCents) * 100);
}

export function isInStock(product: Pick<Product, "stock">): boolean {
  return product.stock > 0;
}

export function shippingCentsFor(
  subtotalCents: number,
  settings: Pick<StoreSettings, "shippingFlatCents" | "freeShippingThresholdCents">,
): number {
  if (subtotalCents <= 0) return 0;
  if (settings.freeShippingThresholdCents !== null && subtotalCents >= settings.freeShippingThresholdCents) return 0;
  return settings.shippingFlatCents;
}
