import "server-only";
import { PRODUCT_SELECT, mapProduct, mapSettings, type ProductRow, type SettingsRow } from "./catalog";
import type { CheckoutResult } from "./checkout-types";
import { DEMO_SETTINGS } from "./demo-data";
import { createCheckoutPreference, getPayment } from "./mercadopago";
import { effectivePriceCents, shippingCentsFor } from "./pricing";
import { createServiceClient } from "./supabase/server";
import type { Order, OrderItem, OrderStatus, Product } from "./types";
import { cartLinesSchema, checkoutCustomerSchema, flattenZodErrors } from "./validation";
import { findVariant } from "./variants";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/* ---------------------------------------------------------------------------
 * Row mapping
 * ------------------------------------------------------------------------- */
export type OrderItemRow = {
  product_id: string | null;
  variant_id?: string | null;
  variant_label: string;
  product_name: string;
  product_slug: string;
  image_url: string | null;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
};

export type OrderRow = {
  id: string;
  order_number: number;
  status: OrderStatus;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_street: string;
  shipping_exterior_number: string;
  shipping_interior_number: string;
  shipping_neighborhood: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_references: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  mp_payment_id: string | null;
  mp_payment_status: string | null;
  tracking_number: string;
  admin_notes: string;
  paid_at: string | null;
  created_at: string;
  order_items?: OrderItemRow[];
};

export const ORDER_SELECT = "*, order_items(product_id, variant_id, variant_label, product_name, product_slug, image_url, unit_price_cents, quantity, line_total_cents)";

function mapOrderItem(row: OrderItemRow): OrderItem {
  return {
    productId: row.product_id,
    variantLabel: row.variant_label ?? "",
    productName: row.product_name,
    productSlug: row.product_slug,
    imageUrl: row.image_url,
    unitPriceCents: row.unit_price_cents,
    quantity: row.quantity,
    lineTotalCents: row.line_total_cents,
  };
}

export function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    shippingStreet: row.shipping_street,
    shippingExteriorNumber: row.shipping_exterior_number,
    shippingInteriorNumber: row.shipping_interior_number,
    shippingNeighborhood: row.shipping_neighborhood,
    shippingCity: row.shipping_city,
    shippingState: row.shipping_state,
    shippingPostalCode: row.shipping_postal_code,
    shippingReferences: row.shipping_references,
    subtotalCents: row.subtotal_cents,
    shippingCents: row.shipping_cents,
    totalCents: row.total_cents,
    mpPaymentId: row.mp_payment_id,
    mpPaymentStatus: row.mp_payment_status,
    trackingNumber: row.tracking_number,
    adminNotes: row.admin_notes,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    items: (row.order_items ?? []).map(mapOrderItem),
  };
}

/* ---------------------------------------------------------------------------
 * Checkout: validate, price on the server, store the order, create the payment
 * ------------------------------------------------------------------------- */
export async function createOrderFromCart(input: { customer: unknown; lines: unknown }): Promise<CheckoutResult> {
  const customer = checkoutCustomerSchema.safeParse(input.customer);
  if (!customer.success) {
    return { ok: false, message: "Revisa los datos marcados.", fieldErrors: flattenZodErrors(customer.error) };
  }
  const lines = cartLinesSchema.safeParse(input.lines);
  if (!lines.success) return { ok: false, message: "Tu carrito está vacío o tiene datos no válidos." };

  // Merge repeated items (same product and size) so stock checks and order items stay consistent.
  const requested = new Map<string, { productId: string; variantId: string | null; quantity: number }>();
  for (const line of lines.data) {
    const key = `${line.productId}::${line.variantId ?? ""}`;
    const current = requested.get(key);
    requested.set(key, { productId: line.productId, variantId: line.variantId, quantity: (current?.quantity ?? 0) + line.quantity });
  }
  const invalidKeys = [...requested.entries()]
    .filter(([, item]) => !isUuid(item.productId) || (item.variantId !== null && !isUuid(item.variantId)))
    .map(([key]) => key);
  if (invalidKeys.length) {
    return { ok: false, message: "Algunos productos de tu carrito ya no existen.", unavailableProductIds: invalidKeys };
  }
  const productIds = [...new Set([...requested.values()].map((item) => item.productId))];

  const supabase = createServiceClient();
  const [{ data: productRows, error: productsError }, { data: settingsRow }] = await Promise.all([
    supabase.from("products").select(PRODUCT_SELECT).in("id", productIds).eq("published", true),
    supabase.from("store_settings").select("*").eq("id", 1).maybeSingle(),
  ]);
  if (productsError) return { ok: false, message: "No pudimos verificar tu carrito. Intenta de nuevo en un momento." };

  const products = new Map((productRows as ProductRow[]).map((row) => [row.id, mapProduct(row)]));
  const unavailable: string[] = [];
  const problems: string[] = [];
  const items: {
    product: Product;
    title: string;
    row: OrderItemRow;
  }[] = [];

  for (const [key, { productId, variantId, quantity }] of requested) {
    const product = products.get(productId);
    const variant = product ? findVariant(product, variantId) : null;
    // A product with sizes must be bought in one of them; a single-size product never carries one.
    const valid = product && (product.variants.length ? variant !== null : variantId === null);
    if (!product || !valid) {
      unavailable.push(key);
      problems.push("un producto ya no está disponible");
      continue;
    }
    const sellable = variant ?? product;
    const title = variant ? `${product.name} (${variant.label})` : product.name;
    if (sellable.stock < quantity) {
      unavailable.push(key);
      problems.push(sellable.stock > 0 ? `de “${title}” solo quedan ${sellable.stock} piezas` : `“${title}” se agotó`);
      continue;
    }
    const unitPriceCents = effectivePriceCents(sellable);
    items.push({
      product,
      title,
      row: {
        product_id: product.id,
        variant_id: variant?.id ?? null,
        variant_label: variant?.label ?? "",
        product_name: product.name,
        product_slug: product.slug,
        image_url: product.images[0] ?? null,
        unit_price_cents: unitPriceCents,
        quantity,
        line_total_cents: unitPriceCents * quantity,
      },
    });
  }
  if (unavailable.length) {
    return {
      ok: false,
      message: `Actualizamos tu carrito: ${problems.join("; ")}. Revisa las cantidades e intenta de nuevo.`,
      unavailableProductIds: unavailable,
    };
  }

  const settings = settingsRow ? mapSettings(settingsRow as SettingsRow) : DEMO_SETTINGS;
  const subtotalCents = items.reduce((sum, item) => sum + item.row.line_total_cents, 0);
  const shippingCents = shippingCentsFor(subtotalCents, settings);
  const data = customer.data;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_name: data.name,
      customer_email: data.email,
      customer_phone: data.phone,
      shipping_street: data.street,
      shipping_exterior_number: data.exteriorNumber,
      shipping_interior_number: data.interiorNumber,
      shipping_neighborhood: data.neighborhood,
      shipping_city: data.city,
      shipping_state: data.state,
      shipping_postal_code: data.postalCode,
      shipping_references: data.references,
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      total_cents: subtotalCents + shippingCents,
    })
    .select("id")
    .single();
  if (orderError || !order) return { ok: false, message: "No pudimos registrar tu pedido. Intenta de nuevo en un momento." };

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(items.map((item) => ({ ...item.row, order_id: order.id })));
  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return { ok: false, message: "No pudimos registrar tu pedido. Intenta de nuevo en un momento." };
  }

  try {
    const preference = await createCheckoutPreference({
      orderId: order.id,
      payer: { name: data.name, email: data.email, phone: data.phone },
      lines: [
        ...items.map((item) => ({
          id: item.row.variant_id ?? item.product.id,
          title: item.title,
          quantity: item.row.quantity,
          unitPriceCents: item.row.unit_price_cents,
          pictureUrl: item.product.images[0],
        })),
        ...(shippingCents > 0 ? [{ id: "envio", title: "Envío a domicilio", quantity: 1, unitPriceCents: shippingCents }] : []),
      ],
    });
    await supabase.from("orders").update({ mp_preference_id: preference.preferenceId }).eq("id", order.id);
    return { ok: true, redirectUrl: preference.checkoutUrl };
  } catch (error) {
    console.error("Mercado Pago preference failed", error);
    await supabase.from("orders").update({ status: "payment_failed", admin_notes: "No se pudo crear el pago en Mercado Pago." }).eq("id", order.id);
    return { ok: false, message: "No pudimos conectar con Mercado Pago. Intenta de nuevo en unos minutos." };
  }
}

/* ---------------------------------------------------------------------------
 * Payment notifications: Mercado Pago's API is the source of truth
 * ------------------------------------------------------------------------- */
export type PaymentSyncResult = { orderId: string; status: OrderStatus } | null;

export async function syncPayment(paymentId: string): Promise<PaymentSyncResult> {
  if (!/^\d{1,20}$/.test(paymentId)) return null;
  const payment = await getPayment(paymentId);
  const orderId = payment.external_reference ?? "";
  if (!isUuid(orderId)) return null;

  const supabase = createServiceClient();
  const { data: order } = await supabase.from("orders").select("id, status, total_cents").eq("id", orderId).maybeSingle();
  if (!order) return null;

  const paymentStatus = payment.status ?? "unknown";
  const paymentFields = { mp_payment_id: String(payment.id ?? paymentId), mp_payment_status: paymentStatus };

  if (paymentStatus === "approved") {
    const paidCents = Math.round((payment.transaction_amount ?? 0) * 100);
    if (paidCents < order.total_cents) {
      await supabase
        .from("orders")
        .update({ ...paymentFields, admin_notes: `Pago aprobado por un monto menor al total (${paidCents / 100} MXN). Revisar.` })
        .eq("id", orderId);
      return { orderId, status: order.status as OrderStatus };
    }
    const { error } = await supabase.rpc("mark_order_paid", {
      p_order_id: orderId,
      p_payment_id: paymentFields.mp_payment_id,
      p_payment_status: paymentStatus,
    });
    if (error) throw new Error(`No se pudo confirmar el pago: ${error.message}`);
    return { orderId, status: order.status === "pending_payment" || order.status === "payment_failed" ? "paid" : (order.status as OrderStatus) };
  }

  if (paymentStatus === "rejected" || paymentStatus === "cancelled") {
    // Only an unpaid order can become "failed"; a later rejected retry must not undo a payment.
    await supabase
      .from("orders")
      .update({ ...paymentFields, status: "payment_failed" })
      .eq("id", orderId)
      .eq("status", "pending_payment");
    return { orderId, status: order.status === "pending_payment" ? "payment_failed" : (order.status as OrderStatus) };
  }

  await supabase.from("orders").update(paymentFields).eq("id", orderId);
  return { orderId, status: order.status as OrderStatus };
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  if (!isUuid(orderId)) return null;
  const { data, error } = await createServiceClient().from("orders").select(ORDER_SELECT).eq("id", orderId).maybeSingle();
  if (error || !data) return null;
  return mapOrder(data as OrderRow);
}
