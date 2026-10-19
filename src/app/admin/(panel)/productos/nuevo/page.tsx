import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeading } from "@/components/admin/admin-heading";
import { ProductForm } from "@/components/admin/product-form";
import { listAdminCategories } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await listAdminCategories();
  return (
    <>
      <Link href="/admin/productos" className="label-caps link-underline text-[0.6875rem] text-ink-soft">
        ← Productos
      </Link>
      <div className="mt-4">
        <AdminHeading title="Nuevo producto" />
      </div>
      {categories.length ? (
        <ProductForm product={null} categories={categories} />
      ) : (
        <p className="border border-line bg-white px-6 py-8 text-ink-soft">
          Primero crea las categorías desde el <Link href="/admin" className="link-underline text-ink">Resumen</Link>.
        </p>
      )}
    </>
  );
}
