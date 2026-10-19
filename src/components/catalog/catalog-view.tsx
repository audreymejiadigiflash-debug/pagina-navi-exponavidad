import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { getCategories, getPublishedProducts } from "@/lib/catalog";
import {
  SORT_OPTIONS,
  applyFilters,
  attributeOptions,
  baseProducts,
  hasActiveFilters,
  parseCatalogQuery,
  sortProducts,
  type RawSearchParams,
} from "@/lib/catalog-query";
import { ATTRIBUTE_LABELS, FILTERABLE_ATTRIBUTES } from "@/lib/constants";
import { FILTERS_ANCHOR, categoryHref } from "@/lib/navigation";
import type { Category } from "@/lib/types";
import { ActiveFilters } from "./active-filters";
import { CatalogFilters, SortSelect, type FilterGroup } from "./catalog-filters";
import { ScrollToHash } from "./scroll-to-hash";

type CatalogViewProps = {
  /** null for the whole store; an unknown id renders the 404 page. */
  categoryId: string | null;
  searchParams: Promise<RawSearchParams>;
};

function headingFor(category: Category | null, search: string, onlySale: boolean) {
  if (search) {
    return {
      title: `Resultados para “${search}”`,
      description: category ? `Buscando en ${category.name}.` : "Buscando en toda la tienda.",
    };
  }
  if (category) return { title: category.name, description: category.description };
  if (onlySale) return { title: "Ofertas", description: "Piezas de temporada con precio especial." };
  return { title: "La tienda", description: "Árboles, esferas, luces, adornos y coronas para tu Navidad." };
}

export async function CatalogView({ categoryId, searchParams }: CatalogViewProps) {
  const [categories, products, params] = await Promise.all([getCategories(), getPublishedProducts(), searchParams]);
  const categoryById = new Map(categories.map((item) => [item.id, item]));
  const category = categoryId ? (categoryById.get(categoryId) ?? null) : null;
  if (categoryId && !category) notFound();
  const query = parseCatalogQuery(params, category?.id ?? null);
  const base = baseProducts(products, categories, query);
  const results = sortProducts(applyFilters(base, query), query.sort);
  const { title, description } = headingFor(category, query.search, query.onlySale);
  const pathname = category ? categoryHref(category.id) : "/tienda";

  const groups: FilterGroup[] = FILTERABLE_ATTRIBUTES.map((key) => ({
    key,
    label: ATTRIBUTE_LABELS[key],
    options: attributeOptions(base, key),
  })).filter((group) => group.options.length >= 2);

  return (
    <>
      <section className="border-b border-line bg-ivory">
        <div className="container-page py-12 text-center md:py-16">
          <nav aria-label="Ruta de navegación" className="mb-5">
            <ol className="label-caps flex flex-wrap justify-center gap-2 text-[0.6875rem] text-ink-soft">
              <li>
                <Link href="/" className="hover:text-ink">
                  Inicio
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              {category ? (
                <>
                  <li>
                    <Link href="/tienda" className="hover:text-ink">
                      Tienda
                    </Link>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li aria-current="page" className="text-ink">
                    {category.shortName}
                  </li>
                </>
              ) : (
                <li aria-current="page" className="text-ink">
                  Tienda
                </li>
              )}
            </ol>
          </nav>
          <h1 className="text-[2.75rem] md:text-[3.75rem]">{title}</h1>
          <p className="mx-auto mt-4 max-w-[60ch] text-ink-soft">{description}</p>
        </div>
      </section>

      {/* Scroll margin clears the sticky header when the menu links to the filters. */}
      <div
        id={FILTERS_ANCHOR}
        className="container-page grid scroll-mt-36 gap-10 py-10 lg:scroll-mt-40 lg:grid-cols-[240px_1fr] lg:py-14"
      >
        <ScrollToHash id={FILTERS_ANCHOR} />
        <CatalogFilters groups={groups} resultCount={results.length} />
        <section aria-label="Productos" className="min-w-0">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
            <p className="text-[0.9rem] text-ink-soft" aria-live="polite">
              {results.length === 1 ? "1 pieza" : `${results.length} piezas`}
            </p>
            <SortSelect options={SORT_OPTIONS} value={query.sort} />
          </div>
          <ActiveFilters pathname={pathname} params={params} query={query} />

          {results.length ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:gap-x-6">
              {results.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  category={categoryById.get(product.categoryId)}
                  priority={index < 2}
                />
              ))}
            </div>
          ) : (
            <div className="border border-line px-6 py-20 text-center">
              <h2 className="text-3xl">
                {products.length ? "No encontramos piezas con esos filtros" : "Muy pronto, nuestra colección"}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-ink-soft">
                {products.length
                  ? "Prueba quitando algún filtro o busca con otras palabras."
                  : "Estamos preparando las piezas de esta temporada. Vuelve muy pronto."}
              </p>
              {products.length && (hasActiveFilters(query) || query.search) ? (
                <Link href={category ? categoryHref(category.id) : "/tienda"} className="btn btn-outline mt-8">
                  Quitar filtros
                </Link>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
