import type { Product, StoreSettings } from "@/lib/types";

/**
 * One purchasable item as the browser cart needs it: a product, or one size of it.
 * Prices are re-checked on the server.
 */
export type CartProduct = Pick<Product, "slug" | "name" | "priceCents" | "salePriceCents" | "stock"> & {
  key: string;
  productId: string;
  variantId: string | null;
  variantLabel: string | null;
  imageUrl: string | null;
  categoryName: string;
};

export type ShippingRules = Pick<StoreSettings, "shippingFlatCents" | "freeShippingThresholdCents">;

export function toCartProducts(product: Product, categoryName: string): CartProduct[] {
  const base = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    imageUrl: product.images[0] ?? null,
    categoryName,
  };
  if (!product.variants.length) {
    return [
      {
        ...base,
        key: `${product.id}::`,
        variantId: null,
        variantLabel: null,
        priceCents: product.priceCents,
        salePriceCents: product.salePriceCents,
        stock: product.stock,
      },
    ];
  }
  return product.variants.map((variant) => ({
    ...base,
    key: `${product.id}::${variant.id}`,
    variantId: variant.id,
    variantLabel: variant.label,
    priceCents: variant.priceCents,
    salePriceCents: variant.salePriceCents,
    stock: variant.stock,
  }));
}
