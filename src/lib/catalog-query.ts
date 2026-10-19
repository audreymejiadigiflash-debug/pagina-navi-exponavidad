import { FILTERABLE_ATTRIBUTES } from "./constants";
import { normalizeSearchText } from "./format";
import { effectivePriceCents, isInStock, isOnSale } from "./pricing";
import { ATTRIBUTE_KEYS, type AttributeKey, type Category, type Product } from "./types";
import { attributeValues } from "./variants";

export const SORT_OPTIONS = [
  { value: "destacados", label: "Destacados" },
  { value: "novedades", label: "Novedades" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
  { value: "nombre", label: "Nombre (A–Z)" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export type CatalogQuery = {
  categoryId: string | null;
  search: string;
  onlySale: boolean;
  inStockOnly: boolean;
  minPesos: number | null;
  maxPesos: number | null;
  attributes: Partial<Record<AttributeKey, string[]>>;
  sort: SortKey;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

function asList(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

function asNumber(value: string | string[] | undefined): number | null {
  const [first] = asList(value);
  if (!first) return null;
  const number = Number(first);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function parseCatalogQuery(params: RawSearchParams, categoryId: string | null): CatalogQuery {
  const [sortParam] = asList(params.orden);
  const sort = SORT_OPTIONS.some((option) => option.value === sortParam) ? (sortParam as SortKey) : "destacados";
  const attributes: CatalogQuery["attributes"] = {};
  for (const key of FILTERABLE_ATTRIBUTES) {
    const values = asList(params[key]);
    if (values.length) attributes[key] = values;
  }
  return {
    categoryId,
    search: (asList(params.q)[0] ?? "").slice(0, 80),
    onlySale: asList(params.oferta)[0] === "1",
    inStockOnly: asList(params.disponible)[0] === "1",
    minPesos: asNumber(params.precio_min),
    maxPesos: asNumber(params.precio_max),
    attributes,
    sort,
  };
}

function searchableText(product: Product, categories: Category[]): string {
  const category = categories.find((item) => item.id === product.categoryId);
  return normalizeSearchText(
    [product.name, product.description, category?.name ?? "", ...ATTRIBUTE_KEYS.flatMap((key) => attributeValues(product, key))].join(" "),
  );
}

/** Products matching category + search only; drives which filter options are offered. */
export function baseProducts(products: Product[], categories: Category[], query: CatalogQuery): Product[] {
  const words = normalizeSearchText(query.search).split(/\s+/).filter(Boolean);
  return products.filter((product) => {
    if (query.categoryId && product.categoryId !== query.categoryId) return false;
    if (!words.length) return true;
    const haystack = searchableText(product, categories);
    return words.every((word) => haystack.includes(word));
  });
}

export function applyFilters(products: Product[], query: CatalogQuery): Product[] {
  return products.filter((product) => {
    // A product with sizes matches the price range when any of its sizes does.
    const prices = (product.variants.length ? product.variants : [product]).map((item) => effectivePriceCents(item) / 100);
    if (query.onlySale && !isOnSale(product)) return false;
    if (query.inStockOnly && !isInStock(product)) return false;
    if (
      !prices.some(
        (price) => (query.minPesos === null || price >= query.minPesos) && (query.maxPesos === null || price <= query.maxPesos),
      )
    ) {
      return false;
    }
    return FILTERABLE_ATTRIBUTES.every((key) => {
      const selected = query.attributes[key];
      if (!selected?.length) return true;
      return attributeValues(product, key).some((value) => selected.includes(value));
    });
  });
}

export function sortProducts(products: Product[], sort: SortKey): Product[] {
  const sorted = [...products];
  const newest = (a: Product, b: Product) => b.createdAt.localeCompare(a.createdAt);
  switch (sort) {
    case "precio-asc":
      return sorted.sort((a, b) => effectivePriceCents(a) - effectivePriceCents(b));
    case "precio-desc":
      return sorted.sort((a, b) => effectivePriceCents(b) - effectivePriceCents(a));
    case "nombre":
      return sorted.sort((a, b) => a.name.localeCompare(b.name, "es"));
    case "novedades":
      return sorted.sort(newest);
    default:
      return sorted.sort(
        (a, b) =>
          Number(isInStock(b)) - Number(isInStock(a)) || Number(b.featured) - Number(a.featured) || newest(a, b),
      );
  }
}

export type AttributeOption = { value: string; count: number };

function compareOptionValues(a: string, b: string): number {
  const numberA = parseFloat(a);
  const numberB = parseFloat(b);
  if (!Number.isNaN(numberA) && !Number.isNaN(numberB)) return numberA - numberB;
  return a.localeCompare(b, "es");
}

export function attributeOptions(products: Product[], key: AttributeKey): AttributeOption[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    for (const value of new Set(attributeValues(product, key))) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => compareOptionValues(a.value, b.value));
}

export function hasActiveFilters(query: CatalogQuery): boolean {
  return (
    query.onlySale ||
    query.inStockOnly ||
    query.minPesos !== null ||
    query.maxPesos !== null ||
    Object.values(query.attributes).some((values) => values && values.length > 0)
  );
}
