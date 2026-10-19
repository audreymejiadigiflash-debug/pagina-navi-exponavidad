import { revalidateTag } from "next/cache";
import { CATALOG_CACHE_TAG } from "@/lib/catalog";
import { isCheckoutConfigured } from "@/lib/env";
import { isValidWebhookSignature } from "@/lib/mercadopago";
import { syncPayment } from "@/lib/orders";

/*
 * Mercado Pago payment notifications. We never trust the request body: the signature is
 * checked and then the payment is fetched from Mercado Pago's API before touching the order.
 */
export async function POST(request: Request) {
  if (!isCheckoutConfigured()) return new Response("Not configured", { status: 503 });

  const url = new URL(request.url);
  const body = (await request.json().catch(() => null)) as { type?: string; data?: { id?: string | number } } | null;
  const type = url.searchParams.get("type") ?? body?.type ?? "";
  const dataId = url.searchParams.get("data.id") ?? (body?.data?.id !== undefined ? String(body.data.id) : null);

  const signed = isValidWebhookSignature({
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataId: url.searchParams.get("data.id"),
  });
  if (!signed) return new Response("Invalid signature", { status: 401 });

  // Other topics (merchant orders, etc.) are acknowledged so Mercado Pago stops retrying.
  if (type !== "payment" || !dataId) return new Response("Ignored", { status: 200 });

  try {
    const result = await syncPayment(dataId);
    // Paid orders change stock, so the storefront must refresh its cached catalog.
    if (result?.status === "paid") revalidateTag(CATALOG_CACHE_TAG, "max");
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Mercado Pago webhook failed", error);
    // 500 makes Mercado Pago retry the notification later.
    return new Response("Error", { status: 500 });
  }
}
