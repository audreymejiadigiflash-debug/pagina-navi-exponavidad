import type { MetadataRoute } from "next";
import { getCategories, getPublishedProducts } from "@/lib/catalog";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories(), getPublishedProducts()]);
  const staticPages = ["", "/tienda", "/envios-y-devoluciones", "/terminos-y-condiciones", "/aviso-de-privacidad"];
  return [
    ...staticPages.map((path) => ({ url: `${siteUrl}${path}`, changeFrequency: "weekly" as const, priority: path ? 0.6 : 1 })),
    ...categories.map((category) => ({ url: `${siteUrl}/tienda/${category.id}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...products.map((product) => ({
      url: `${siteUrl}/producto/${product.slug}`,
      lastModified: product.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
