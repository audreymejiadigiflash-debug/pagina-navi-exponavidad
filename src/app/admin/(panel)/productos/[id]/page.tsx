import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeading } from "@/components/admin/admin-heading";
import { ProductForm } from "@/components/admin/product-form";
import { getAdminProduct, listAdminCategories } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { isUuid } from "@/lib/orders";

export const metadata: Metadata = { title: "Editar producto" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/productos/[id]">) {
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();
  const [product, categories] = await Promise.all([getAdminProduct(id), listAdminCategories()]);
  if (!product) notFound();

  return (
    <>
      <Link href="/admin/productos" className="label-caps link-underline text-[0.6875rem] text-ink-soft">
        ← Productos
      </Link>
      <div className="mt-4">
        <AdminHeading
          title={product.name}
          description={product.published ? "Publicado en la tienda" : "Borrador: no se muestra en la tienda"}
          actions={
            product.published ? (
              <Link href={`/producto/${product.slug}`} target="_blank" className="btn btn-outline btn-sm">
                Ver en la tienda ↗
              </Link>
            ) : null
          }
        />
      </div>
      {query.nuevo === "1" ? (
        <p className="mb-6 border border-success/30 bg-white px-4 py-3 text-[0.9rem] text-success" role="status">
          Producto creado.
        </p>
      ) : null}
      <ProductForm key={product.id} product={product} categories={categories} />
    </>
  );
}
