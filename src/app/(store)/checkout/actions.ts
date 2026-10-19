"use server";

import type { CheckoutResult } from "@/lib/checkout-types";
import { isCheckoutConfigured } from "@/lib/env";
import { createOrderFromCart } from "@/lib/orders";

export async function startCheckout(input: { customer: unknown; lines: unknown }): Promise<CheckoutResult> {
  if (!isCheckoutConfigured()) {
    return { ok: false, message: "Los pagos en línea todavía no están disponibles." };
  }
  return createOrderFromCart(input);
}
