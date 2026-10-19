import { effectivePriceCents } from "./pricing";
import type { AttributeKey, Product, ProductVariant } from "./types";

/** Sizes always start with a number ("1.90 m", "8 cm"); any other variant label is a color. */
function isSizeLabel(label: string): boolean {
  return /^\d/.test(label.trim());
}

/** Name shown next to the variant selector, in the cart and in orders. */
export function variantKindName(labels: string[]): "Medida" | "Color" {
  return labels.every(isSizeLabel) ? "Medida" : "Color";
}

/** Which characteristic size labels stand for, so catalog filters see every size. */
export function variantAttributeFor(categoryId: string): AttributeKey {
  return categoryId === "arboles" ? "altura" : "medidas";
}

/**
 * Fills the product-level price and stock from its variants: the cheapest size sets the
 * "from" price and the stock is the total across sizes. Listings, filters and sorting then
 * work the same for products with and without sizes.
 */
export function withVariantSummary(product: Product): Product {
  if (!product.variants.length) return product;
  const cheapest = product.variants.reduce((best, variant) =>
    effectivePriceCents(variant) < effectivePriceCents(best) ? variant : best,
  );
  return {
    ...product,
    priceCents: cheapest.priceCents,
    salePriceCents: cheapest.salePriceCents,
    stock: product.variants.reduce((sum, variant) => sum + variant.stock, 0),
  };
}

/** True when sizes have different prices, so listings show "Desde". */
export function hasPriceRange(product: Pick<Product, "variants">): boolean {
  return new Set(product.variants.map((variant) => effectivePriceCents(variant))).size > 1;
}

/** Values of a characteristic for filtering and search; sizes count as their own values. */
export function attributeValues(product: Product, key: AttributeKey): string[] {
  if (product.variants.length) {
    const labels = product.variants.map((variant) => variant.label);
    const variantKey = variantKindName(labels) === "Color" ? "color" : variantAttributeFor(product.categoryId);
    if (key === variantKey) return labels;
  }
  const value = product.attributes[key];
  return value ? [value] : [];
}

export function findVariant(product: Pick<Product, "variants">, variantId: string | null): ProductVariant | null {
  if (variantId === null) return null;
  return product.variants.find((variant) => variant.id === variantId) ?? null;
}
