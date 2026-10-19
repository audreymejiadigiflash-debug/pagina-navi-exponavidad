"use client";

import { useSyncExternalStore } from "react";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/constants";

export type CartLine = { productId: string; variantId: string | null; quantity: number };

/** Identifies one purchasable item: a product, or one size of it. */
export function cartLineKey(line: Pick<CartLine, "productId" | "variantId">): string {
  return `${line.productId}::${line.variantId ?? ""}`;
}

const STORAGE_KEY = "naviexpo-cart-v2";
const EMPTY: CartLine[] = [];

let lines: CartLine[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function clampQuantity(quantity: number): number {
  return Math.max(1, Math.min(MAX_QUANTITY_PER_ITEM, Math.floor(quantity)));
}

function readStorage(): CartLine[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed
      .filter(
        (line): line is CartLine =>
          typeof line?.productId === "string" && typeof line?.quantity === "number" && line.quantity > 0,
      )
      .map((line) => ({
        productId: line.productId,
        variantId: typeof line.variantId === "string" ? line.variantId : null,
        quantity: clampQuantity(line.quantity),
      }));
  } catch {
    return EMPTY;
  }
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  lines = readStorage();
}

function commit(next: CartLine[]) {
  lines = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage may be unavailable (private mode); the cart still works during this visit.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    lines = readStorage();
    for (const item of listeners) item();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  ensureLoaded();
  return lines;
}

function getServerSnapshot() {
  return EMPTY;
}

export const cartActions = {
  add(productId: string, variantId: string | null, quantity = 1) {
    ensureLoaded();
    const key = cartLineKey({ productId, variantId });
    const existing = lines.find((line) => cartLineKey(line) === key);
    commit(
      existing
        ? lines.map((line) =>
            cartLineKey(line) === key ? { ...line, quantity: clampQuantity(line.quantity + quantity) } : line,
          )
        : [...lines, { productId, variantId, quantity: clampQuantity(quantity) }],
    );
  },
  setQuantity(key: string, quantity: number) {
    commit(lines.map((line) => (cartLineKey(line) === key ? { ...line, quantity: clampQuantity(quantity) } : line)));
  },
  remove(key: string) {
    commit(lines.filter((line) => cartLineKey(line) !== key));
  },
  /** Drops lines whose products or sizes no longer exist or are sold out. */
  retain(keys: Set<string>) {
    const next = lines.filter((line) => keys.has(cartLineKey(line)));
    if (next.length !== lines.length) commit(next);
  },
  clear() {
    commit(EMPTY);
  },
};

export function useCartLines(): CartLine[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** True once the browser cart has been read; avoids flashing "empty cart" during hydration. */
export function useCartHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
