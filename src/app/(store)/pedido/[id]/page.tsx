import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ClearCartOnPaid } from "@/components/cart/clear-cart-on-paid";
import { CheckIcon } from "@/components/icons";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { isCheckoutConfigured } from "@/lib/env";
import { formatOrderNumber, formatPrice } from "@/lib/format";
import { getOrderById, syncPayment } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";
import { variantKindName } from "@/lib/variants";

export const metadata: Metadata = {
  title: "Tu pedido",
  robots: { index: false, follow: false },
};

const PAID_STATUSES: OrderStatus[] = ["paid", "preparing", "shipped", "delivered"];

const MESSAGES: Record<"paid" | "pending" | "failed" | "cancelled", { title: string; text: string }> = {
  paid: {
    title: "¡Gracias por tu compra!",
    text: "Recibimos tu pago. Estamos preparando tu pedido y te contactaremos para coordinar la entrega.",
  },
  pending: {
    title: "Tu pago está en proceso",
    text: "Si pagaste en OXXO o por transferencia, la confirmación puede tardar algunas horas. Vuelve a esta página más tarde para ver el estado de tu pedido.",
  },
  failed: {
    title: "No se completó el pago",
    text: "Mercado Pago no aprobó el pago. Tu carrito sigue guardado: puedes intentarlo de nuevo con otro método.",
  },
  cancelled: {
    title: "Pedido cancelado",
    text: "Este pedido fue cancelado. Si tienes dudas, escríbenos y con gusto te ayudamos.",
  },
};

async function OrderDetails({ params, searchParams }: PageProps<"/pedido/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!isCheckoutConfigured()) notFound();

  // Returning from Mercado Pago: confirm the payment right away instead of waiting for the webhook.
  const paymentId = typeof query.payment_id === "string" ? query.payment_id : null;
  if (paymentId) {
    try {
      await syncPayment(paymentId);
    } catch (error) {
      console.error("Payment sync on return failed", error);
    }
  }

  const order = await getOrderById(id);
  if (!order) notFound();

  const state = PAID_STATUSES.includes(order.status)
    ? "paid"
    : order.status === "payment_failed"
      ? "failed"
      : order.status === "cancelled"
        ? "cancelled"
        : "pending";
  const message = MESSAGES[state];

  return (
    <div className="container-page max-w-3xl py-16 md:py-24">
      {state === "paid" ? <ClearCartOnPaid /> : null}
      <div className="text-center">
        {state === "paid" ? (
          <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-fir text-white">
            <CheckIcon size={28} />
          </span>
        ) : null}
        <span className="eyebrow">Pedido {formatOrderNumber(order.orderNumber)}</span>
        <h1 className="mt-3 text-[2.6rem] md:text-[3.25rem]">{message.title}</h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-soft">{message.text}</p>
        <p className="label-caps mt-6 inline-block border border-line px-4 py-2 text-[0.6875rem]">
          Estado: {ORDER_STATUS_LABELS[order.status]}
        </p>
      </div>

      <section aria-labelledby="order-items-title" className="mt-14 border border-line">
        <h2 id="order-items-title" className="border-b border-line px-6 py-4 text-[1.6rem]">
          Resumen del pedido
        </h2>
        <ul>
          {order.items.map((item) => (
            <li key={item.productSlug} className="flex items-center gap-4 border-b border-line px-6 py-4">
              <span className="relative block aspect-[4/5] w-16 shrink-0 overflow-hidden bg-ivory">
                {item.imageUrl ? <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" /> : null}
              </span>
              <span className="flex-1 text-[0.95rem]">
                {item.productName}
                {item.variantLabel ? <span className="block text-[0.8125rem] text-ink">{variantKindName([item.variantLabel])}: {item.variantLabel}</span> : null}
                <span className="block text-[0.8125rem] text-ink-soft">
                  {item.quantity} × {formatPrice(item.unitPriceCents)}
                </span>
              </span>
              <span>{formatPrice(item.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 px-6 py-5 text-[0.95rem]">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd>{formatPrice(order.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Envío</dt>
            <dd>{order.shippingCents ? formatPrice(order.shippingCents) : "Gratis"}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 font-medium">
            <dt>Total</dt>
            <dd>{formatPrice(order.totalCents)}</dd>
          </div>
        </dl>
        <div className="border-t border-line px-6 py-5 text-[0.9rem] text-ink-soft">
          <p className="label-caps mb-2 text-[0.6875rem] text-ink">Envío a</p>
          <p>
            {order.customerName} · {order.shippingCity}, {order.shippingState}
          </p>
          {order.trackingNumber ? <p className="mt-2">Guía de rastreo: {order.trackingNumber}</p> : null}
        </div>
      </section>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {state === "failed" ? (
          <Link href="/checkout" className="btn btn-primary">
            Intentar de nuevo
          </Link>
        ) : null}
        <Link href="/tienda" className="btn btn-outline">
          Seguir comprando
        </Link>
      </div>
      <p className="mt-8 text-center text-[0.8125rem] text-ink-soft">
        Guarda esta página: es la liga para consultar el estado de tu pedido.
      </p>
    </div>
  );
}

export default function OrderPage(props: PageProps<"/pedido/[id]">) {
  return (
    <Suspense
      fallback={<div className="container-page h-[60vh] max-w-3xl animate-pulse bg-ivory" aria-busy="true" aria-label="Cargando tu pedido" />}
    >
      <OrderDetails {...props} />
    </Suspense>
  );
}
