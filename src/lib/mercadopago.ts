import "server-only";
import { MercadoPagoConfig, Payment, Preference, WebhookSignatureValidator } from "mercadopago";
import { CURRENCY, STORE_NAME } from "./constants";
import { env } from "./env";

const REQUEST_TIMEOUT_MS = 10_000;

function config(idempotencyKey?: string) {
  return new MercadoPagoConfig({
    accessToken: env.mercadoPagoAccessToken,
    options: { timeout: REQUEST_TIMEOUT_MS, ...(idempotencyKey ? { idempotencyKey } : {}) },
  });
}

export type PreferenceLine = { id: string; title: string; quantity: number; unitPriceCents: number; pictureUrl?: string };

type CreatePreferenceInput = {
  orderId: string;
  lines: PreferenceLine[];
  payer: { name: string; email: string; phone: string };
};

/** Absolute https URL for images, as Mercado Pago cannot read relative paths. */
function absoluteUrl(path: string | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https:\/\//.test(path)) return path;
  return env.siteUrl.startsWith("https://") ? `${env.siteUrl}${path.startsWith("/") ? "" : "/"}${path}` : undefined;
}

/** Creates a Checkout Pro preference and returns the URL where the buyer pays. */
export async function createCheckoutPreference({ orderId, lines, payer }: CreatePreferenceInput) {
  const orderUrl = `${env.siteUrl}/pedido/${orderId}`;
  // Mercado Pago only accepts auto-return and notifications on public https URLs.
  const isPublicSite = env.siteUrl.startsWith("https://");

  const preference = await new Preference(config(`preference-${orderId}`)).create({
    body: {
      external_reference: orderId,
      items: lines.map((line) => ({
        id: line.id,
        title: line.title,
        quantity: line.quantity,
        unit_price: line.unitPriceCents / 100,
        currency_id: CURRENCY,
        picture_url: absoluteUrl(line.pictureUrl),
      })),
      payer: {
        name: payer.name,
        email: payer.email,
        phone: { number: payer.phone },
      },
      back_urls: { success: orderUrl, pending: orderUrl, failure: orderUrl },
      ...(isPublicSite
        ? { auto_return: "approved", notification_url: `${env.siteUrl}/api/webhooks/mercadopago` }
        : {}),
      statement_descriptor: STORE_NAME.toUpperCase().slice(0, 22),
      metadata: { order_id: orderId },
    },
  });

  if (!preference.id || !preference.init_point) {
    throw new Error("Mercado Pago no devolvió la liga de pago.");
  }
  return { preferenceId: preference.id, checkoutUrl: preference.init_point };
}

export async function getPayment(paymentId: string) {
  return new Payment(config()).get({ id: paymentId });
}

type WebhookHeaders = { xSignature: string | null; xRequestId: string | null; dataId: string | null };

/** True when the notification is signed with our secret (or when no secret is configured yet). */
export function isValidWebhookSignature(headers: WebhookHeaders): boolean {
  if (!env.mercadoPagoWebhookSecret) return true;
  try {
    WebhookSignatureValidator.validate({ ...headers, secret: env.mercadoPagoWebhookSecret, toleranceSeconds: 600 });
    return true;
  } catch {
    return false;
  }
}
