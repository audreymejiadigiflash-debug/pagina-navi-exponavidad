import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { DEMO_CATEGORIES, DEMO_PRODUCTS, DEMO_SETTINGS } from "./demo-data";
import { isSupabaseConfigured } from "./env";
import { createPublicClient } from "./supabase/server";
import type { Category, Product, ProductAttributes, ProductBadge, ProductVariant, StoreSettings } from "./types";
import { withVariantSummary } from "./variants";

/* ---------------------------------------------------------------------------
 * Row mapping (database snake_case → app camelCase)
 * ------------------------------------------------------------------------- */
export type CategoryRow = {
  id: string;
  name: string;
  short_name: string;
  description: string;
  image_url: string | null;
  sort_order: number;
};

export type VariantRow = {
  id: string;
  label: string;
  price_cents: number;
  sale_price_cents: number | null;
  stock: number;
  sort_order: number;
};

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  category_id: string;
  description: string;
  price_cents: number;
  sale_price_cents: number | null;
  stock: number;
  images: string[] | null;
  badge: ProductBadge | null;
  featured: boolean;
  published: boolean;
  attributes: ProductAttributes | null;
  created_at: string;
  product_variants?: VariantRow[];
};

/** Products are always read together with their sizes. */
export const PRODUCT_SELECT = "*, product_variants(id, label, price_cents, sale_price_cents, stock, sort_order)";

export type SettingsRow = {
  shipping_flat_cents: number;
  free_shipping_threshold_cents: number | null;
  promo_text: string;
  business_name: string;
  contact_email: string;
  contact_phone: string;
  business_address: string;
};

export function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    description: row.description,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
  };
}

function mapVariant(row: VariantRow): ProductVariant {
  return {
    id: row.id,
    label: row.label,
    priceCents: row.price_cents,
    salePriceCents: row.sale_price_cents,
    stock: row.stock,
  };
}

export function mapProduct(row: ProductRow): Product {
  const variants = [...(row.product_variants ?? [])].sort((a, b) => a.sort_order - b.sort_order).map(mapVariant);
  return withVariantSummary({
    id: row.id,
    slug: row.slug,
    name: row.name,
    categoryId: row.category_id,
    description: row.description,
    priceCents: row.price_cents,
    salePriceCents: row.sale_price_cents,
    stock: row.stock,
    images: row.images ?? [],
    badge: row.badge,
    featured: row.featured,
    published: row.published,
    attributes: row.attributes ?? {},
    variants,
    createdAt: row.created_at,
  });
}

export function mapSettings(row: SettingsRow): StoreSettings {
  return {
    shippingFlatCents: row.shipping_flat_cents,
    freeShippingThresholdCents: row.free_shipping_threshold_cents,
    promoText: row.promo_text,
    businessName: row.business_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    businessAddress: row.business_address,
  };
}

/* ---------------------------------------------------------------------------
 * Public catalog reads. Cached and tagged so admin edits and paid orders can
 * refresh the storefront right away (invalidate CATALOG_CACHE_TAG).
 * ------------------------------------------------------------------------- */
export const CATALOG_CACHE_TAG = "catalog";

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_CACHE_TAG);
  if (!isSupabaseConfigured()) return DEMO_CATEGORIES;
  const { data, error } = await createPublicClient().from("categories").select("*").order("sort_order");
  if (error) throw new Error(`No se pudieron cargar las categorías: ${error.message}`);
  return (data as CategoryRow[]).map(mapCategory);
}

export async function getPublishedProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_CACHE_TAG);
  if (!isSupabaseConfigured()) return DEMO_PRODUCTS;
  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudieron cargar los productos: ${error.message}`);
  return (data as ProductRow[]).map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getPublishedProducts();
  return products.find((product) => product.slug === slug) ?? null;
}

export async function getStoreSettings(): Promise<StoreSettings> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_CACHE_TAG);
  if (!isSupabaseConfigured()) return DEMO_SETTINGS;
  const { data, error } = await createPublicClient().from("store_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(`No se pudo cargar la configuración: ${error.message}`);
  return data ? mapSettings(data as SettingsRow) : DEMO_SETTINGS;
}
