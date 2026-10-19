import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogSkeleton } from "@/components/catalog/catalog-skeleton";
import { CatalogView } from "@/components/catalog/catalog-view";
import { getCategories } from "@/lib/catalog";

export async function generateMetadata({ params }: PageProps<"/tienda/[categoria]">): Promise<Metadata> {
  const { categoria } = await params;
  const category = (await getCategories()).find((item) => item.id === categoria);
  if (!category) return { title: "Categoría no encontrada" };
  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: `/tienda/${category.id}` },
    openGraph: category.imageUrl ? { images: [{ url: category.imageUrl }] } : undefined,
  };
}

async function CategoryCatalog({ params, searchParams }: PageProps<"/tienda/[categoria]">) {
  const { categoria } = await params;
  return <CatalogView categoryId={categoria} searchParams={searchParams} />;
}

export default function CategoryPage(props: PageProps<"/tienda/[categoria]">) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CategoryCatalog {...props} />
    </Suspense>
  );
}
