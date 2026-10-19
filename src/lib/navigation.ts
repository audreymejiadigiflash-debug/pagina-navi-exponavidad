import { ATTRIBUTE_LABELS, FILTERABLE_ATTRIBUTES } from "./constants";
import { attributeOptions } from "./catalog-query";
import { isInStock, isOnSale } from "./pricing";
import type { Category, Product } from "./types";

/** `count` is how many pieces the link leads to, shown so shoppers know what to expect. */
export type NavLink = { label: string; href: string; count?: number };
export type NavColumn = { title: string; links: NavLink[]; more?: NavLink };
export type NavCategory = {
  id: string;
  label: string;
  href: string;
  description: string;
  imageUrl: string | null;
  productCount: number;
  columns: NavColumn[];
};

const MAX_ATTRIBUTE_COLUMNS = 2;
const MAX_LINKS_PER_COLUMN = 6;

/** Anchor of the filter sidebar, so "Ver todas" lands next to the full option list. */
export const FILTERS_ANCHOR = "filtros";

export function categoryHref(categoryId: string, params?: Record<string, string>, hash?: string): string {
  const search = params ? `?${new URLSearchParams(params).toString()}` : "";
  return `/tienda/${categoryId}${search}${hash ? `#${hash}` : ""}`;
}

function exploreLinks(categoryId: string, inCategory: Product[]): NavLink[] {
  const links: NavLink[] = [
    { label: "Ver todo", href: categoryHref(categoryId), count: inCategory.length },
    { label: "Novedades", href: categoryHref(categoryId, { orden: "novedades" }) },
    { label: "Precio más bajo", href: categoryHref(categoryId, { orden: "precio-asc" }) },
  ];
  const onSale = inCategory.filter(isOnSale).length;
  if (onSale) links.push({ label: "En oferta", href: categoryHref(categoryId, { oferta: "1" }), count: onSale });
  const inStock = inCategory.filter(isInStock).length;
  // Only worth offering when it actually hides something.
  if (inStock && inStock < inCategory.length) {
    links.push({ label: "Disponibles ahora", href: categoryHref(categoryId, { disponible: "1" }), count: inStock });
  }
  return links;
}

/** Builds the mega menu from live catalog data, so new attribute values appear automatically. */
export function buildNavigation(categories: Category[], products: Product[]): NavCategory[] {
  return categories.map((category) => {
    const inCategory = products.filter((product) => product.categoryId === category.id);

    const attributeColumns: NavColumn[] = FILTERABLE_ATTRIBUTES.map((key) => ({
      key,
      options: attributeOptions(inCategory, key),
    }))
      .filter(({ options }) => options.length >= 2)
      .slice(0, MAX_ATTRIBUTE_COLUMNS)
      .map(({ key, options }) => {
        const label = ATTRIBUTE_LABELS[key].toLowerCase();
        return {
          title: `Por ${label}`,
          links: options.slice(0, MAX_LINKS_PER_COLUMN).map((option) => ({
            label: option.value,
            href: categoryHref(category.id, { [key]: option.value }),
            count: option.count,
          })),
          more:
            options.length > MAX_LINKS_PER_COLUMN
              ? { label: `Ver las ${options.length} opciones`, href: categoryHref(category.id, undefined, FILTERS_ANCHOR) }
              : undefined,
        };
      });

    return {
      id: category.id,
      label: category.shortName,
      href: categoryHref(category.id),
      description: category.description,
      imageUrl: category.imageUrl,
      productCount: inCategory.length,
      columns: [{ title: "Explorar", links: exploreLinks(category.id, inCategory) }, ...attributeColumns],
    };
  });
}
