import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeading } from "@/components/admin/admin-heading";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { listAdminOrders } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatDateTime, formatOrderNumber, formatPrice } from "@/lib/format";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Pedidos" };

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/pedidos">) {
  await requireAdmin();
  const params = await searchParams;
  const status = ORDER_STATUSES.find((item) => item === params.estado) ?? null;
  const orders = await listAdminOrders(status);

  const filters: { value: OrderStatus | null; label: string }[] = [
    { value: null, label: "Todos" },
    ...ORDER_STATUSES.map((value) => ({ value, label: ORDER_STATUS_LABELS[value] })),
  ];

  return (
    <>
      <AdminHeading title="Pedidos" description="Los últimos 200 pedidos. Los pagados aparecen automáticamente." />
      <nav aria-label="Filtrar por estado" className="mb-6 overflow-x-auto">
        <ul className="flex gap-2">
          {filters.map((filter) => {
            const active = filter.value === status;
            return (
              <li key={filter.label}>
                <Link
                  href={filter.value ? `/admin/pedidos?estado=${filter.value}` : "/admin/pedidos"}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-10 items-center whitespace-nowrap border px-4 text-[0.8125rem] ${active ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"}`}
                >
                  {filter.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {orders.length ? (
        <ul className="divide-y divide-line border border-line bg-white">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/pedidos/${order.id}`}
                className="grid gap-1 px-4 py-4 hover:bg-ivory md:grid-cols-[140px_1.5fr_1fr_1fr_auto] md:items-center md:gap-4"
              >
                <span className="font-medium">{formatOrderNumber(order.orderNumber)}</span>
                <span className="min-w-0">
                  <span className="block truncate">{order.customerName}</span>
                  <span className="block truncate text-[0.8125rem] text-ink-soft">
                    {order.shippingCity}, {order.shippingState}
                  </span>
                </span>
                <span className="text-[0.875rem] text-ink-soft">{formatDateTime(order.createdAt)}</span>
                <span>{formatPrice(order.totalCents)}</span>
                <span>
                  <OrderStatusBadge status={order.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="border border-line bg-white px-6 py-12 text-center">
          <h2 className="text-[1.75rem]">Sin pedidos {status ? `en “${ORDER_STATUS_LABELS[status]}”` : "todavía"}</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">Cuando alguien compre en la tienda, su pedido aparecerá aquí.</p>
        </div>
      )}
    </>
  );
}
