import "server-only";
import { PRODUCT_SELECT, mapCategory, mapProduct, mapSettings, type CategoryRow, type ProductRow, type SettingsRow } from "./catalog";
import { DEMO_SETTINGS } from "./demo-data";
import { env } from "./env";
import { ORDER_SELECT, mapOrder, type OrderRow } from "./orders";
import { createServiceClient } from "./supabase/server";
import type { Category, Order, OrderStatus, Product, StoreSettings } from "./types";

/* Admin reads bypass RLS (they include drafts and orders). Call only after requireAdmin(). */

export async function listAdminCategories(): Promise<Category[]> {
  const { data, error } = await createServiceClient().from("categories").select("*").order("sort_order");
  if (error) throw new Error(`No se pudieron cargar las categorías: ${error.message}`);
  return (data as CategoryRow[]).map(mapCategory);
}

export async function listAdminProducts(): Promise<Product[]> {
  const { data, error } = await createServiceClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudieron cargar los productos: ${error.message}`);
  return (data as ProductRow[]).map(mapProduct);
}

export async function getAdminProduct(id: string): Promise<Product | null> {
  const { data, error } = await createServiceClient().from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapProduct(data as ProductRow);
}

export async function listAdminOrders(status: OrderStatus | null): Promise<Order[]> {
  let query = createServiceClient().from("orders").select(ORDER_SELECT).order("created_at", { ascending: false }).limit(200);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(`No se pudieron cargar los pedidos: ${error.message}`);
  return (data as OrderRow[]).map(mapOrder);
}

export async function getAdminSettings(): Promise<StoreSettings> {
  const { data } = await createServiceClient().from("store_settings").select("*").eq("id", 1).maybeSingle();
  return data ? mapSettings(data as SettingsRow) : DEMO_SETTINGS;
}

export type DashboardData = {
  ordersToPrepare: number;
  pendingPayment: number;
  paidLast30DaysCents: number;
  paidLast30DaysCount: number;
  productCount: number;
  categoryCount: number;
  lowStock: Product[];
  setup: { label: string; done: boolean; help: string }[];
};

const SALES_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export async function getDashboardData(): Promise<DashboardData> {
  const sinceIso = new Date(Date.now() - SALES_WINDOW_MS).toISOString();
  const supabase = createServiceClient();
  const [toPrepare, pending, paidRecent, products, categories] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["paid", "preparing"]),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending_payment"),
    supabase
      .from("orders")
      .select("total_cents")
      .in("status", ["paid", "preparing", "shipped", "delivered"])
      .gte("paid_at", sinceIso),
    supabase.from("products").select(PRODUCT_SELECT),
    supabase.from("categories").select("id", { count: "exact", head: true }),
  ]);

  const productList = ((products.data ?? []) as ProductRow[]).map(mapProduct);
  const paidRows = (paidRecent.data ?? []) as { total_cents: number }[];

  return {
    ordersToPrepare: toPrepare.count ?? 0,
    pendingPayment: pending.count ?? 0,
    paidLast30DaysCents: paidRows.reduce((sum, row) => sum + row.total_cents, 0),
    paidLast30DaysCount: paidRows.length,
    productCount: productList.length,
    categoryCount: categories.count ?? 0,
    lowStock: productList
      .filter((product) => product.published && product.stock <= 3)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 8),
    setup: [
      {
        label: "Categorías creadas",
        done: (categories.count ?? 0) > 0,
        help: "Usa “Cargar catálogo de ejemplo” para crear las categorías.",
      },
      {
        label: "Mercado Pago conectado",
        done: Boolean(env.mercadoPagoAccessToken),
        help: "Agrega MERCADOPAGO_ACCESS_TOKEN en las variables de entorno.",
      },
      {
        label: "Notificaciones de pago firmadas",
        done: Boolean(env.mercadoPagoWebhookSecret),
        help: "Agrega MERCADOPAGO_WEBHOOK_SECRET (Mercado Pago → Tus integraciones → Webhooks).",
      },
      {
        label: "Sitio publicado con https",
        done: env.siteUrl.startsWith("https://"),
        help: "Define NEXT_PUBLIC_SITE_URL con tu dominio (por ejemplo https://naviexponavidad.com).",
      },
    ],
  };
}
