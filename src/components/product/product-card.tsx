import Link from "next/link";
import type { Category, Product } from "@/lib/types";
import { hasPriceRange, variantKindName } from "@/lib/variants";
import { Price } from "./price";
import { ProductBadges } from "./product-badges";
import { ProductImage } from "./product-image";

type ProductCardProps = {
  product: Product;
  category?: Category;
  priority?: boolean;
};

const CARD_SIZES = "(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw";

function attributeSummary(product: Product): string {
  const { altura, luz, piezas, medidas } = product.attributes;
  const count = product.variants.length;
  const plural = variantKindName(product.variants.map((variant) => variant.label)) === "Color" ? "colores" : "medidas";
  const sizes = count > 1 ? `${count} ${plural}` : product.variants[0]?.label;
  return [sizes ?? altura, luz, piezas && /^\d+$/.test(piezas) ? `${piezas} piezas` : piezas, medidas]
    .filter(Boolean)
    .slice(0, 2)
    .join(" · ");
}

export function ProductCard({ product, category, priority = false }: ProductCardProps) {
  const [primary, secondary] = product.images;
  const summary = attributeSummary(product);

  return (
    <article className="group relative flex min-w-0 flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-ivory">
        <ProductBadges product={product} />
        <ProductImage
          src={primary}
          alt={product.name}
          sizes={CARD_SIZES}
          priority={priority}
          className="transition duration-700 ease-[var(--ease-elegant)] group-hover:scale-[1.03]"
        />
        {secondary ? (
          <ProductImage
            src={secondary}
            alt=""
            sizes={CARD_SIZES}
            className="opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 pt-4">
        {category ? <p className="label-caps text-[0.6875rem] text-ink-soft">{category.shortName}</p> : null}
        <h3 className="font-sans text-[0.975rem] font-normal leading-snug">
          <Link
            href={`/producto/${product.slug}`}
            className="after:absolute after:inset-0 hover:underline hover:underline-offset-4"
          >
            {product.name}
          </Link>
        </h3>
        {summary ? <p className="text-[0.8125rem] text-ink-soft">{summary}</p> : null}
        <div className="mt-1">
          <Price product={product} from={hasPriceRange(product)} />
        </div>
      </div>
    </article>
  );
}
