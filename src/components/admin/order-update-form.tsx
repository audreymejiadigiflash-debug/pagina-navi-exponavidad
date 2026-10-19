"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateOrder } from "@/app/admin/actions";
import { ADMIN_SETTABLE_STATUSES, ORDER_STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";

type OrderUpdateFormProps = {
  orderId: string;
  status: OrderStatus;
  trackingNumber: string;
  adminNotes: string;
};

export function OrderUpdateForm({ orderId, status, trackingNumber, adminNotes }: OrderUpdateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const canEditStatus = status !== "pending_payment" && status !== "payment_failed";

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setFeedback(null);
        startTransition(async () => {
          const result = await updateOrder(orderId, {
            // Unpaid orders only get notes; their status is driven by Mercado Pago.
            ...(canEditStatus ? { status: data.get("status") } : {}),
            trackingNumber: data.get("trackingNumber") ?? "",
            adminNotes: data.get("adminNotes") ?? "",
          });
          if (!result.ok) {
            setFeedback({ tone: "error", text: result.message });
            return;
          }
          setFeedback({ tone: "ok", text: "Pedido actualizado." });
          router.refresh();
        });
      }}
    >
      {canEditStatus ? (
        <div>
          <label htmlFor="order-status" className="field-label">
            Estado
          </label>
          <select id="order-status" name="status" defaultValue={status} className="input">
            {ADMIN_SETTABLE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {ORDER_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
          <p className="field-hint">Cancelar un pedido pagado no reembolsa el dinero: hazlo desde Mercado Pago.</p>
        </div>
      ) : (
        <p className="text-[0.875rem] text-ink-soft">
          Este pedido aún no está pagado. Su estado cambia solo cuando Mercado Pago confirma el pago.
        </p>
      )}
      <div>
        <label htmlFor="order-tracking" className="field-label">
          Guía de rastreo <span className="font-normal text-ink-soft">(opcional)</span>
        </label>
        <input id="order-tracking" name="trackingNumber" defaultValue={trackingNumber} className="input" maxLength={80} />
        <p className="field-hint">El cliente la verá en la página de su pedido.</p>
      </div>
      <div>
        <label htmlFor="order-notes" className="field-label">
          Notas internas <span className="font-normal text-ink-soft">(opcional)</span>
        </label>
        <textarea id="order-notes" name="adminNotes" defaultValue={adminNotes} className="input" rows={3} maxLength={1000} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary btn-sm" disabled={isPending} aria-busy={isPending}>
          {isPending ? "Guardando…" : canEditStatus ? "Guardar cambios" : "Guardar notas"}
        </button>
        <span aria-live="polite" className={`text-[0.875rem] ${feedback?.tone === "error" ? "text-error" : "text-success"}`}>
          {feedback?.text}
        </span>
      </div>
    </form>
  );
}
