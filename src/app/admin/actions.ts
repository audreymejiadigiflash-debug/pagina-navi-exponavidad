"use server";

import { updateTag } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/auth";
import { CATALOG_CACHE_TAG } from "@/lib/catalog";
import { ATTRIBUTE_CATEGORIES, PRODUCT_IMAGES_BUCKET } from "@/lib/constants";
import { DEMO_CATEGORIES, DEMO_PRODUCTS } from "@/lib/demo-data";
import { slugify } from "@/lib/format";
import { isUuid } from "@/lib/orders";
import { effectivePriceCents } from "@/lib/pricing";
import { createServiceClient } from "@/lib/supabase/server";
import { variantAttributeFor } from "@/lib/variants";
import { ATTRIBUTE_KEYS } from "@/lib/types";
import {
  flattenZodErrors,
  orderUpdateSchema,
  productFormSchema,
  settingsFormSchema,
  type FieldErrors,
  type ProductFormValues,
} from "@/lib/validation";

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; message: string; fieldErrors?: FieldErrors };

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/webp", "image/jpeg", "image/png"];

const toCents = (pesos: number) => Math.round(pesos * 100);

/* ---------------------------------------------------------------------------
 * Products
 * ------------------------------------------------------------------------- */
async function uniqueSlug(name: string, ignoreId?: string): Promise<string> {
  const base = slugify(name) || "producto";
  const { data } = await createServiceClient().from("products").select("id, slug").like("slug", `${base}%`);
  const taken = new Set((data ?? []).filter((row) => row.id !== ignoreId).map((row) => row.slug as string));
  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

type ServiceClient = ReturnType<typeof createServiceClient>;
type VariantInput = ProductFormValues["variants"][number];

/** Product-level price and stock: the single price, or a summary of the sizes. */
function priceSummary(values: ProductFormValues) {
  if (values.single) {
    return {
      price_cents: toCents(values.single.price),
      sale_price_cents: values.single.salePrice === null ? null : toCents(values.single.salePrice),
      stock: values.single.stock,
    };
  }
  const variants = values.variants.map((variant) => ({
    priceCents: toCents(variant.price),
    salePriceCents: variant.salePrice === null ? null : toCents(variant.salePrice),
    stock: variant.stock,
  }));
  const cheapest = variants.reduce((best, variant) => (effectivePriceCents(variant) < effectivePriceCents(best) ? variant : best));
  return {
    price_cents: cheapest.priceCents,
    sale_price_cents: cheapest.salePriceCents,
    stock: variants.reduce((sum, variant) => sum + variant.stock, 0),
  };
}

/** Makes the stored sizes match the form: updates kept ones, adds new ones, removes the rest. */
async function syncVariants(supabase: ServiceClient, productId: string, variants: VariantInput[]): Promise<boolean> {
  const { data: existing, error } = await supabase.from("product_variants").select("id").eq("product_id", productId);
  if (error) return false;
  const existingIds = new Set((existing ?? []).map((row) => row.id as string));
  const keptIds = new Set(variants.map((variant) => variant.id).filter((id) => existingIds.has(id)));
  const removedIds = [...existingIds].filter((id) => !keptIds.has(id));
  if (removedIds.length) {
    const { error: deleteError } = await supabase.from("product_variants").delete().in("id", removedIds);
    if (deleteError) return false;
  }
  const rowFor = (variant: VariantInput, index: number) => ({
    product_id: productId,
    label: variant.label,
    price_cents: toCents(variant.price),
    sale_price_cents: variant.salePrice === null ? null : toCents(variant.salePrice),
    stock: variant.stock,
    sort_order: index,
  });
  for (const [index, variant] of variants.entries()) {
    if (!keptIds.has(variant.id)) continue;
    const { error: updateError } = await supabase
      .from("product_variants")
      .update(rowFor(variant, index))
      .eq("id", variant.id)
      .eq("product_id", productId);
    if (updateError) return false;
  }
  const added = variants.flatMap((variant, index) => (keptIds.has(variant.id) ? [] : [rowFor(variant, index)]));
  if (added.length) {
    const { error: insertError } = await supabase.from("product_variants").insert(added);
    if (insertError) return false;
  }
  return true;
}

const SIZES_SAVE_ERROR = "Se guardó el producto, pero no sus medidas. Revisa que no haya medidas repetidas e intenta de nuevo.";

export async function saveProduct(productId: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors: flattenZodErrors(parsed.error) };
  }
  const values = parsed.data;
  if (productId !== null && !isUuid(productId)) return { ok: false, message: "Producto no válido." };

  const supabase = createServiceClient();
  const { data: category } = await supabase.from("categories").select("id").eq("id", values.categoryId).maybeSingle();
  if (!category) return { ok: false, message: "Elige una categoría válida.", fieldErrors: { categoryId: "Elige una categoría." } };

  // Keep only attributes that apply to the chosen category, and drop empty ones.
  const attributes = Object.fromEntries(
    ATTRIBUTE_KEYS.filter((key) => {
      const allowed = ATTRIBUTE_CATEGORIES[key];
      if (values.variants.length && key === variantAttributeFor(values.categoryId)) return false;
      return values.attributes[key] && (!allowed || allowed.includes(values.categoryId));
    }).map((key) => [key, values.attributes[key]]),
  );

  const row = {
    name: values.name,
    category_id: values.categoryId,
    description: values.description,
    ...priceSummary(values),
    images: values.images,
    badge: values.badge || null,
    featured: values.featured,
    published: values.published,
    attributes,
  };

  if (productId === null) {
    const { data, error } = await supabase
      .from("products")
      .insert({ ...row, slug: await uniqueSlug(values.name) })
      .select("id")
      .single();
    if (error || !data) return { ok: false, message: "No se pudo guardar el producto. Intenta de nuevo." };
    const sizesSaved = await syncVariants(supabase, data.id as string, values.variants);
    updateTag(CATALOG_CACHE_TAG);
    if (!sizesSaved) return { ok: false, message: SIZES_SAVE_ERROR };
    return { ok: true, data: { id: data.id as string } };
  }

  const { error } = await supabase.from("products").update(row).eq("id", productId);
  if (error) return { ok: false, message: "No se pudo guardar el producto. Intenta de nuevo." };
  const sizesSaved = await syncVariants(supabase, productId, values.variants);
  updateTag(CATALOG_CACHE_TAG);
  if (!sizesSaved) return { ok: false, message: SIZES_SAVE_ERROR };
  return { ok: true, data: { id: productId } };
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  await requireAdmin();
  if (!isUuid(productId)) return { ok: false, message: "Producto no válido." };
  const { error } = await createServiceClient().from("products").delete().eq("id", productId);
  if (error) return { ok: false, message: "No se pudo eliminar el producto." };
  updateTag(CATALOG_CACHE_TAG);
  return { ok: true };
}

export async function uploadProductImage(formData: FormData): Promise<ActionResult<{ url: string }>> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, message: "No se recibió ninguna foto." };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return { ok: false, message: "Usa fotos JPG, PNG o WebP." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, message: "La foto pesa más de 5 MB." };

  const extension = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
  const path = `${new Date().getFullYear()}/${randomUUID()}.${extension}`;
  const storage = createServiceClient().storage.from(PRODUCT_IMAGES_BUCKET);
  const { error } = await storage.upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) return { ok: false, message: "No se pudo subir la foto. Intenta de nuevo." };
  return { ok: true, data: { url: storage.getPublicUrl(path).data.publicUrl } };
}

/** Creates the default categories and the sample products (safe to run more than once). */
export async function loadSampleCatalog(): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error: categoriesError } = await supabase.from("categories").upsert(
    DEMO_CATEGORIES.map((category) => ({
      id: category.id,
      name: category.name,
      short_name: category.shortName,
      description: category.description,
      image_url: category.imageUrl,
      sort_order: category.sortOrder,
    })),
    { onConflict: "id" },
  );
  if (categoriesError) return { ok: false, message: "No se pudieron crear las categorías." };

  const { error: productsError } = await supabase.from("products").upsert(
    DEMO_PRODUCTS.map((product) => ({
      slug: product.slug,
      name: product.name,
      category_id: product.categoryId,
      description: product.description,
      price_cents: product.priceCents,
      sale_price_cents: product.salePriceCents,
      stock: product.stock,
      images: product.images,
      badge: product.badge,
      featured: product.featured,
      published: true,
      attributes: product.attributes,
    })),
    { onConflict: "slug", ignoreDuplicates: true },
  );
  if (productsError) return { ok: false, message: "Se crearon las categorías, pero no los productos de ejemplo." };

  // Sizes are added only to products that have none yet, so running this again changes nothing.
  const sized = DEMO_PRODUCTS.filter((product) => product.variants.length);
  if (sized.length) {
    const { data: stored, error: storedError } = await supabase
      .from("products")
      .select("id, slug, product_variants(id)")
      .in("slug", sized.map((product) => product.slug));
    if (storedError) return { ok: false, message: "Se crearon los productos, pero no sus medidas." };
    const rows = (stored ?? []).flatMap((row) => {
      if ((row.product_variants as unknown[] | null)?.length) return [];
      const demo = sized.find((product) => product.slug === row.slug);
      return (demo?.variants ?? []).map((variant, index) => ({
        product_id: row.id as string,
        label: variant.label,
        price_cents: variant.priceCents,
        sale_price_cents: variant.salePriceCents,
        stock: variant.stock,
        sort_order: index,
      }));
    });
    if (rows.length) {
      const { error: variantsError } = await supabase.from("product_variants").insert(rows);
      if (variantsError) return { ok: false, message: "Se crearon los productos, pero no sus medidas." };
    }
  }
  updateTag(CATALOG_CACHE_TAG);
  return { ok: true };
}

export async function deleteSampleProducts(): Promise<ActionResult> {
  await requireAdmin();
  const { error } = await createServiceClient().from("products").delete().like("slug", "ejemplo-%");
  if (error) return { ok: false, message: "No se pudieron eliminar los productos de ejemplo." };
  updateTag(CATALOG_CACHE_TAG);
  return { ok: true };
}

/* ---------------------------------------------------------------------------
 * Orders and settings
 * ------------------------------------------------------------------------- */
export async function updateOrder(orderId: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  if (!isUuid(orderId)) return { ok: false, message: "Pedido no válido." };
  const parsed = orderUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors: flattenZodErrors(parsed.error) };
  }
  const supabase = createServiceClient();
  if (parsed.data.status) {
    // Paid-like statuses can only be set on orders that Mercado Pago already confirmed.
    const { data: current } = await supabase.from("orders").select("status").eq("id", orderId).maybeSingle();
    if (!current) return { ok: false, message: "Pedido no encontrado." };
    if ((current.status === "pending_payment" || current.status === "payment_failed") && parsed.data.status !== "cancelled") {
      return { ok: false, message: "Este pedido aún no está pagado; su estado lo actualiza Mercado Pago." };
    }
  }
  const { error } = await supabase
    .from("orders")
    .update({
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      tracking_number: parsed.data.trackingNumber,
      admin_notes: parsed.data.adminNotes,
    })
    .eq("id", orderId);
  if (error) return { ok: false, message: "No se pudo actualizar el pedido." };
  return { ok: true };
}

export async function saveSettings(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = settingsFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors: flattenZodErrors(parsed.error) };
  }
  const values = parsed.data;
  const { error } = await createServiceClient()
    .from("store_settings")
    .upsert({
      id: 1,
      shipping_flat_cents: toCents(values.shippingFlat),
      free_shipping_threshold_cents: values.freeShippingThreshold === null ? null : toCents(values.freeShippingThreshold),
      promo_text: values.promoText,
      business_name: values.businessName,
      contact_email: values.contactEmail,
      contact_phone: values.contactPhone,
      business_address: values.businessAddress,
    });
  if (error) return { ok: false, message: "No se pudo guardar la configuración." };
  updateTag(CATALOG_CACHE_TAG);
  return { ok: true };
}
