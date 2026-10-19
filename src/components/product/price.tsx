import { formatPrice } from "@/lib/format";
import { isOnSale } from "@/lib/pricing";
import type { Product } from "@/lib/types";

type PriceProps = {
  product: Pick<Product, "priceCents" | "salePriceCents">;
  size?: "md" | "lg";
  /** Prefixes "Desde" when sizes have different prices. */
  from?: boolean;
};

export function Price({ product, size = "md", from = false }: PriceProps) {
  const large = size === "lg";
  const prefix = from ? <span className="mr-1.5 text-[0.8em] text-ink-soft">Desde</span> : null;
  if (!isOnSale(product)) {
    return (
      <p className={large ? "font-serif text-3xl" : "text-[0.95rem] text-ink"}>
        {prefix}
        {formatPrice(product.priceCents)}
      </p>
    );
  }
  return (
    <p className={`flex flex-wrap items-baseline gap-x-3 ${large ? "font-serif text-3xl" : "text-[0.95rem]"}`}>
      <span className="text-claret">
        {prefix}
        <span className="sr-only">Precio de oferta: </span>
        {formatPrice(product.salePriceCents as number)}
      </span>
      <span className={`text-ink-soft line-through ${large ? "text-xl" : "text-sm"}`}>
        <span className="sr-only">Precio anterior: </span>
        {formatPrice(product.priceCents)}
      </span>
    </p>
  );
}
