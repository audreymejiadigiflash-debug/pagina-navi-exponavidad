import { ATTRIBUTE_LABELS, FILTERABLE_ATTRIBUTES } from "./constants";
import { attributeOptions } from "./catalog-query";
import { isOnSale } from "./pricing";
import type { Category, Product } from "./types";

export type NavLink = { label: string; href: string };
export type NavColumn = { title: string; links: NavLink[] };
export type NavCategory = {
  id: string;
  label: string;
  href: string;
  description: string;
  imageUrl: string | null;
  columns: NavColumn[];
};

const MAX_ATTRIBUTE_COLUMNS = 2;
const MAX_LINKS_PER_COLUMN = 6;

export function categoryHref(categoryId: string, params?: Record<string, string>): string {
  const search = params ? `?${new URLSearchParams(params).toString()}` : "";
  return `/tienda/${categoryId}${search}`;
}

/** Builds the mega menu from live catalog data, so new attribute values appear automatically. */
export function buildNavigation(categories: Category[], products: Product[]): NavCategory[] {
  return categories.map((category) => {
    const inCategory = products.filter((product) => product.categoryId === category.id);
    const explore: NavLink[] = [
      { label: `Ver todo`, href: categoryHref(category.id) },
      { label: "Novedades", href: categoryHref(category.id, { orden: "novedades" }) },
    ];
    if (inCategory.some(isOnSale)) explore.push({ label: "En oferta", href: categoryHref(category.id, { oferta: "1" }) });

    const attributeColumns: NavColumn[] = FILTERABLE_ATTRIBUTES.map((key) => ({
      key,
      options: attributeOptions(inCategory, key),
    }))
      .filter(({ options }) => options.length >= 2)
      .slice(0, MAX_ATTRIBUTE_COLUMNS)
      .map(({ key, options }) => ({
        title: `Por ${ATTRIBUTE_LABELS[key].toLowerCase()}`,
        links: options
          .slice(0, MAX_LINKS_PER_COLUMN)
          .map((option) => ({ label: option.value, href: categoryHref(category.id, { [key]: option.value }) })),
      }));

    return {
      id: category.id,
      label: category.shortName,
      href: categoryHref(category.id),
      description: category.description,
      imageUrl: category.imageUrl,
      columns: [{ title: "Explorar", links: explore }, ...attributeColumns],
    };
  });
}
