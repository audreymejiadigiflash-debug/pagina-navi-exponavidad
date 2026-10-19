import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ActionButton } from "@/components/admin/action-button";
import { AdminHeading } from "@/components/admin/admin-heading";
import { CheckIcon } from "@/components/icons";
import { getDashboardData } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { deleteSampleProducts, loadSampleCatalog } from "../actions";

export const metadata: Metadata = { title: "Resumen" };

function StatCard({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <>
      <span className="label-caps block text-[0.6875rem] text-ink-soft">{label}</span>
      <span className="mt-2 block font-serif text-[2.5rem] leading-none">{value}</span>
    </>
  );
  return href ? (
    <Link href={href} className="block border border-line bg-white p-6 hover:border-ink">
      {content}
    </Link>
  ) : (
    <div className="border border-line bg-white p-6">{content}</div>
  );
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  await connection();
  const data = await getDashboardData();
  const setupPending = data.setup.filter((item) => !item.done);

  return (
    <>
      <AdminHeading title="Resumen" description="Lo más importante de tu tienda de un vistazo." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pedidos por preparar" value={String(data.ordersToPrepare)} href="/admin/pedidos?estado=paid" />
        <StatCard label="Esperando pago" value={String(data.pendingPayment)} href="/admin/pedidos?estado=pending_payment" />
        <StatCard
          label={`Ventas 30 días (${data.paidLast30DaysCount})`}
          value={formatPrice(data.paidLast30DaysCents)}
        />
        <StatCard label="Productos" value={String(data.productCount)} href="/admin/productos" />
      </div>

      {setupPending.length ? (
        <section aria-labelledby="setup-title" className="mt-10 border border-line bg-white p-6">
          <h2 id="setup-title" className="text-[1.75rem]">
            Configuración pendiente
          </h2>
          <ul className="mt-4 space-y-3">
            {data.setup.map((item) => (
              <li key={item.label} className="flex items-start gap-3 text-[0.925rem]">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${item.done ? "bg-success text-white" : "border border-line-strong"}`}
                  aria-hidden="true"
                >
                  {item.done ? <CheckIcon size={12} /> : null}
                </span>
                <span>
                  <span className={item.done ? "text-ink-soft line-through" : "text-ink"}>{item.label}</span>
                  {!item.done ? <span className="block text-[0.8125rem] text-ink-soft">{item.help}</span> : null}
                  <span className="sr-only">{item.done ? " (listo)" : " (pendiente)"}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="catalog-title" className="mt-10 border border-line bg-white p-6">
        <h2 id="catalog-title" className="text-[1.75rem]">
          Catálogo de ejemplo
        </h2>
        <p className="mt-2 max-w-2xl text-[0.925rem] text-ink-soft">
          Crea las cinco categorías de la tienda, tus modelos de árbol y productos de ejemplo con fotografías. Cuando
          cargues tus productos, elimina los de ejemplo con un clic.
        </p>
        <div className="mt-5 flex flex-wrap gap-4">
          <ActionButton
            action={loadSampleCatalog}
            label="Cargar catálogo de ejemplo"
            pendingLabel="Cargando…"
            successMessage="Catálogo de ejemplo cargado."
            variant="primary"
          />
          <ActionButton
            action={deleteSampleProducts}
            label="Eliminar productos de ejemplo"
            pendingLabel="Eliminando…"
            successMessage="Productos de ejemplo eliminados."
            confirmMessage="¿Eliminar todos los productos de ejemplo? Tus productos no se tocan."
            variant="danger"
          />
        </div>
      </section>

      <section aria-labelledby="stock-title" className="mt-10 border border-line bg-white p-6">
        <h2 id="stock-title" className="text-[1.75rem]">
          Inventario bajo
        </h2>
        {data.lowStock.length ? (
          <ul className="mt-4 divide-y divide-line">
            {data.lowStock.map((product) => (
              <li key={product.id} className="flex items-center justify-between gap-4 py-3 text-[0.925rem]">
                <Link href={`/admin/productos/${product.id}`} className="hover:underline hover:underline-offset-4">
                  {product.name}
                </Link>
                <span className={product.stock === 0 ? "text-error" : "text-ink-soft"}>
                  {product.stock === 0 ? "Agotado" : `${product.stock} piezas`}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[0.925rem] text-ink-soft">Todos tus productos publicados tienen más de 3 piezas.</p>
        )}
      </section>
    </>
  );
}
