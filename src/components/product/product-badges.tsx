import { BADGE_LABELS } from "@/lib/constants";
import { discountPercent, isInStock, isOnSale } from "@/lib/pricing";
import type { Product } from "@/lib/types";

export function ProductBadges({ product }: { product: Product }) {
  const badges: { label: string; tone: "light" | "sale" | "muted" }[] = [];
  if (!isInStock(product)) badges.push({ label: "Agotado", tone: "muted" });
  if (isOnSale(product)) badges.push({ label: `−${discountPercent(product)}%`, tone: "sale" });
  if (product.badge) badges.push({ label: BADGE_LABELS[product.badge], tone: "light" });
  if (!badges.length) return null;

  const toneClass = {
    light: "bg-white text-ink",
    sale: "bg-claret text-white",
    muted: "bg-ink text-white",
  } as const;

  return (
    <ul className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
      {badges.map((badge) => (
        <li key={badge.label} className={`label-caps px-2.5 py-1 text-[0.625rem] ${toneClass[badge.tone]}`}>
          {badge.label}
        </li>
      ))}
    </ul>
  );
}
