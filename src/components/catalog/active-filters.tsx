import Link from "next/link";
import { CloseIcon } from "@/components/icons";
import type { CatalogQuery, RawSearchParams } from "@/lib/catalog-query";
import { ATTRIBUTE_LABELS, FILTERABLE_ATTRIBUTES } from "@/lib/constants";
import { formatPrice } from "@/lib/format";

type Chip = { label: string; href: string };

/** Params kept when filters are cleared: they describe what is shown, not how it is narrowed. */
const KEPT_PARAMS = new Set(["q", "orden"]);

function toSearchParams(params: RawSearchParams): URLSearchParams {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) search.append(key, item);
  }
  return search;
}

function withSearch(pathname: string, search: URLSearchParams): string {
  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function hrefWithout(pathname: string, params: RawSearchParams, keys: string[], value?: string): string {
  const search = toSearchParams(params);
  for (const key of keys) {
    const remaining = value === undefined ? [] : search.getAll(key).filter((item) => item !== value);
    search.delete(key);
    for (const item of remaining) search.append(key, item);
  }
  return withSearch(pathname, search);
}

function priceLabel(min: number | null, max: number | null): string {
  const pesos = (value: number) => formatPrice(value * 100);
  if (min !== null && max !== null) return `${pesos(min)} – ${pesos(max)}`;
  return min !== null ? `Desde ${pesos(min)}` : `Hasta ${pesos(max ?? 0)}`;
}

function chipsFor(pathname: string, params: RawSearchParams, query: CatalogQuery): Chip[] {
  const chips: Chip[] = [];
  for (const key of FILTERABLE_ATTRIBUTES) {
    for (const value of query.attributes[key] ?? []) {
      chips.push({ label: `${ATTRIBUTE_LABELS[key]}: ${value}`, href: hrefWithout(pathname, params, [key], value) });
    }
  }
  if (query.minPesos !== null || query.maxPesos !== null) {
    chips.push({
      label: `Precio: ${priceLabel(query.minPesos, query.maxPesos)}`,
      href: hrefWithout(pathname, params, ["precio_min", "precio_max"]),
    });
  }
  if (query.onlySale) chips.push({ label: "Solo ofertas", href: hrefWithout(pathname, params, ["oferta"]) });
  if (query.inStockOnly) chips.push({ label: "Disponibles ahora", href: hrefWithout(pathname, params, ["disponible"]) });
  return chips;
}

/** Shows what the menu or sidebar applied, each removable in one click. */
export function ActiveFilters({ pathname, params, query }: { pathname: string; params: RawSearchParams; query: CatalogQuery }) {
  const chips = chipsFor(pathname, params, query);
  if (!chips.length) return null;

  const kept = toSearchParams(params);
  for (const key of [...kept.keys()]) if (!KEPT_PARAMS.has(key)) kept.delete(key);

  return (
    <div className="mb-8 flex flex-wrap items-center gap-2" aria-label="Filtros aplicados" role="group">
      {chips.map((chip) => (
        <Link
          key={chip.label}
          href={chip.href}
          scroll={false}
          className="inline-flex min-h-9 items-center gap-2 border border-line-strong bg-ivory px-3 text-[0.875rem] text-ink no-underline hover:border-ink"
        >
          {chip.label}
          <CloseIcon size={14} />
          <span className="sr-only">(quitar filtro)</span>
        </Link>
      ))}
      {chips.length > 1 ? (
        <Link
          href={withSearch(pathname, kept)}
          scroll={false}
          className="label-caps ml-1 text-[0.6875rem] text-ink-soft underline underline-offset-4 hover:text-ink"
        >
          Quitar todos
        </Link>
      ) : null}
    </div>
  );
}
