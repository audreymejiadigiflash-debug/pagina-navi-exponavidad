import { ORDER_STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";

const TONES: Record<OrderStatus, string> = {
  pending_payment: "bg-linen text-ink",
  paid: "bg-fir text-white",
  preparing: "bg-gold text-white",
  shipped: "bg-ink text-white",
  delivered: "bg-success text-white",
  cancelled: "bg-line text-ink-soft",
  payment_failed: "bg-claret text-white",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`label-caps inline-block px-2.5 py-1 text-[0.5625rem] ${TONES[status]}`}>{ORDER_STATUS_LABELS[status]}</span>;
}
