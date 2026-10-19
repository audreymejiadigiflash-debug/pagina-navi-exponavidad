import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogSkeleton } from "@/components/catalog/catalog-skeleton";
import { CatalogView } from "@/components/catalog/catalog-view";

export const metadata: Metadata = {
  title: "Tienda",
  description:
    "Compra en línea árboles de Navidad, esferas, luces, adornos y coronas. Filtra por altura, tipo de luz, color y precio.",
  alternates: { canonical: "/tienda" },
};

export default function StorePage({ searchParams }: PageProps<"/tienda">) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogView categoryId={null} searchParams={searchParams} />
    </Suspense>
  );
}
