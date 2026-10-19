import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeading } from "@/components/admin/admin-heading";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { OrderUpdateForm } from "@/components/admin/order-update-form";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, formatOrderNumber, formatPrice } from "@/lib/format";
import { getOrderById } from "@/lib/orders";
import { variantKindName } from "@/lib/variants";

export const metadata: Metadata = { title: "Pedido" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-line bg-white p-5">
      <h2 className="label-caps mb-4 font-sans text-[0.6875rem] font-medium">{title}</h2>
      {children}
    </section>
  );
}

export default async function AdminOrderPage({ params }: PageProps<"/admin/pedidos/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const address = [
    `${order.shippingStreet} ${order.shippingExteriorNumber}${order.shippingInteriorNumber ? `, int. ${order.shippingInteriorNumber}` : ""}`,
    `Col. ${order.shippingNeighborhood}`,
    `${order.shippingPostalCode} ${order.shippingCity}, ${order.shippingState}`,
  ];

  return (
    <>
      <Link href="/admin/pedidos" className="label-caps link-underline text-[0.6875rem] text-ink-soft">
        ← Pedidos
      </Link>
      <div className="mt-4">
        <AdminHeading
          title={`Pedido ${formatOrderNumber(order.orderNumber)}`}
          description={`Creado el ${formatDateTime(order.createdAt)}${order.paidAt ? ` · Pagado el ${formatDateTime(order.paidAt)}` : ""}`}
          actions={<OrderStatusBadge status={order.status} />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Section title="Productos">
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.productSlug} className="flex items-center gap-4 py-3">
                  <span className="relative block aspect-[4/5] w-12 shrink-0 overflow-hidden bg-ivory">
                    {item.imageUrl ? <Image src={item.imageUrl} alt="" fill sizes="48px" className="object-cover" /> : null}
                  </span>
                  <span className="flex-1 text-[0.925rem]">
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
            <dl className="mt-4 space-y-1 border-t border-line pt-4 text-[0.925rem]">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd>{formatPrice(order.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Envío</dt>
                <dd>{order.shippingCents ? formatPrice(order.shippingCents) : "Gratis"}</dd>
              </div>
              <div className="flex justify-between font-medium">
                <dt>Total</dt>
                <dd>{formatPrice(order.totalCents)}</dd>
              </div>
            </dl>
          </Section>

          <Section title="Cliente y envío">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="text-[0.925rem]">
                <p>{order.customerName}</p>
                <p>
                  <a href={`mailto:${order.customerEmail}`} className="link-underline">
                    {order.customerEmail}
                  </a>
                </p>
                <p>
                  <a href={`tel:${order.customerPhone}`} className="link-underline">
                    {order.customerPhone}
                  </a>
                </p>
              </div>
              <address className="text-[0.925rem] not-italic">
                {address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
                {order.shippingReferences ? (
                  <span className="mt-2 block text-ink-soft">Referencias: {order.shippingReferences}</span>
                ) : null}
              </address>
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Gestión del pedido">
            <OrderUpdateForm
              orderId={order.id}
              status={order.status}
              trackingNumber={order.trackingNumber}
              adminNotes={order.adminNotes}
            />
          </Section>
          <Section title="Pago">
            <dl className="space-y-1 text-[0.9rem]">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">ID de pago Mercado Pago</dt>
                <dd>{order.mpPaymentId ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Estado en Mercado Pago</dt>
                <dd>{order.mpPaymentStatus ?? "—"}</dd>
              </div>
            </dl>
          </Section>
        </div>
      </div>
    </>
  );
}
