import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdminHeading } from "@/components/admin/admin-heading";
import { listAdminCategories, listAdminProducts } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { formatPrice, normalizeSearchText } from "@/lib/format";
import { effectivePriceCents, isOnSale } from "@/lib/pricing";

export const metadata: Metadata = { title: "Productos" };

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/productos">) {
  await requireAdmin();
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q : "";
  const categoryFilter = typeof params.categoria === "string" ? params.categoria : "";
  const [products, categories] = await Promise.all([listAdminProducts(), listAdminCategories()]);
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const words = normalizeSearchText(search).split(/\s+/).filter(Boolean);
  const visible = products.filter(
    (product) =>
      (!categoryFilter || product.categoryId === categoryFilter) &&
      words.every((word) => normalizeSearchText(product.name).includes(word)),
  );

  return (
    <>
      <AdminHeading
        title="Productos"
        description={`${products.length} en total`}
        actions={
          <Link href="/admin/productos/nuevo" className="btn btn-primary btn-sm">
            Nuevo producto
          </Link>
        }
      />

      <form className="mb-6 grid gap-3 border border-line bg-white p-4 md:grid-cols-[2fr_1fr_auto]" role="search">
        <div>
          <label htmlFor="admin-q" className="field-label">
            Buscar
          </label>
          <input id="admin-q" name="q" type="search" defaultValue={search} placeholder="Nombre del producto" className="input" />
        </div>
        <div>
          <label htmlFor="admin-category" className="field-label">
            Categoría
          </label>
          <select id="admin-category" name="categoria" defaultValue={categoryFilter} className="input">
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn btn-outline btn-sm w-full">
            Filtrar
          </button>
        </div>
      </form>

      {!categories.length ? (
        <div className="border border-line bg-white px-6 py-12 text-center">
          <h2 className="text-[1.75rem]">Primero crea las categorías</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">
            Ve al Resumen y usa “Cargar catálogo de ejemplo” para crear las categorías de la tienda.
          </p>
          <Link href="/admin" className="btn btn-primary btn-sm mt-6">
            Ir al Resumen
          </Link>
        </div>
      ) : !visible.length ? (
        <div className="border border-line bg-white px-6 py-12 text-center">
          <h2 className="text-[1.75rem]">{products.length ? "Sin resultados" : "Aún no tienes productos"}</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">
            {products.length ? "Ningún producto coincide con tu búsqueda." : "Crea tu primer producto para mostrarlo en la tienda."}
          </p>
          {!products.length ? (
            <Link href="/admin/productos/nuevo" className="btn btn-primary btn-sm mt-6">
              Crear producto
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="divide-y divide-line border border-line bg-white">
          {visible.map((product) => (
            <li key={product.id}>
              <Link
                href={`/admin/productos/${product.id}`}
                className="grid grid-cols-[56px_1fr] items-center gap-4 px-4 py-3 hover:bg-ivory md:grid-cols-[56px_2fr_1fr_1fr_1fr]"
              >
                <span className="relative block aspect-[4/5] w-14 overflow-hidden bg-ivory">
                  {product.images[0] ? (
                    <Image src={product.images[0]} alt="" fill sizes="56px" className="object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[0.95rem]">{product.name}</span>
                  <span className="block text-[0.8125rem] text-ink-soft md:hidden">
                    {formatPrice(effectivePriceCents(product))} · {product.stock} piezas
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    {!product.published ? <span className="label-caps bg-line px-2 py-0.5 text-[0.5625rem]">Borrador</span> : null}
                    {product.featured ? <span className="label-caps bg-linen px-2 py-0.5 text-[0.5625rem]">Destacado</span> : null}
                    {isOnSale(product) ? <span className="label-caps bg-claret px-2 py-0.5 text-[0.5625rem] text-white">Oferta</span> : null}
                    {product.slug.startsWith("ejemplo-") ? <span className="label-caps border border-line px-2 py-0.5 text-[0.5625rem]">Ejemplo</span> : null}
                  </span>
                </span>
                <span className="hidden text-[0.875rem] text-ink-soft md:block">{categoryNames.get(product.categoryId)}</span>
                <span className="hidden text-[0.9rem] md:block">
                  {formatPrice(effectivePriceCents(product))}
                </span>
                <span className={`hidden text-[0.9rem] md:block ${product.stock === 0 ? "text-error" : ""}`}>
                  {product.stock === 0 ? "Agotado" : `${product.stock} piezas`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
