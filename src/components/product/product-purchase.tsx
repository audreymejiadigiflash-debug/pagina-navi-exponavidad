"use client";

import { useState } from "react";
import { AddToCart } from "@/components/cart/add-to-cart";
import { formatPrice } from "@/lib/format";
import { effectivePriceCents, isOnSale } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { variantKindName } from "@/lib/variants";
import { Price } from "./price";

const LOW_STOCK_THRESHOLD = 5;

function StockStatus({ stock }: { stock: number }) {
  const inStock = stock > 0;
  return (
    <p className={`flex items-center gap-2 text-[0.875rem] ${inStock ? "text-success" : "text-ink-soft"}`}>
      <span className={`inline-block h-2 w-2 rounded-full ${inStock ? "bg-success" : "bg-line-strong"}`} aria-hidden="true" />
      {!inStock
        ? "Agotado por ahora"
        : stock <= LOW_STOCK_THRESHOLD
          ? `Últimas ${stock} ${stock === 1 ? "pieza" : "piezas"} disponibles`
          : "En existencia"}
    </p>
  );
}

/** Price, availability, size selector and add-to-cart; they all follow the chosen size. */
export function ProductPurchase({ product, description }: { product: Product; description: React.ReactNode }) {
  const { variants } = product;
  const [variantId, setVariantId] = useState<string | null>(
    () => (variants.find((variant) => variant.stock > 0) ?? variants[0])?.id ?? null,
  );
  const variant = variants.find((item) => item.id === variantId) ?? null;
  const sellable = variant ?? product;
  const savings = isOnSale(sellable) ? sellable.priceCents - effectivePriceCents(sellable) : 0;

  return (
    <>
      <div className="mt-5" aria-live="polite">
        <Price product={sellable} size="lg" />
        {savings ? <p className="mt-1 text-[0.875rem] text-claret">Ahorras {formatPrice(savings)}</p> : null}
        <p className="mt-1 text-[0.8125rem] text-ink-soft">IVA incluido</p>
      </div>

      <div className="mt-5">
        <StockStatus stock={sellable.stock} />
      </div>

      {description}

      {variants.length ? (
        <div className="mt-8">
          <label htmlFor="product-variant" className="field-label">
            {variantKindName(variants.map((item) => item.label))}
          </label>
          <select
            id="product-variant"
            className="input"
            value={variantId ?? ""}
            onChange={(event) => setVariantId(event.target.value)}
          >
            {variants.map((item) => (
              <option key={item.id} value={item.id} disabled={item.stock <= 0}>
                {item.label} — {formatPrice(effectivePriceCents(item))}
                {item.stock <= 0 ? " (agotado)" : ""}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className={variants.length ? "mt-5" : "mt-8"}>
        <AddToCart
          key={variant?.id ?? "single"}
          productId={product.id}
          variantId={variant?.id ?? null}
          productName={variant ? `${product.name} (${variant.label})` : product.name}
          stock={sellable.stock}
        />
      </div>
    </>
  );
}
