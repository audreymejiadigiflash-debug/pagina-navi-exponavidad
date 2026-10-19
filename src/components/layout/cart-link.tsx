"use client";

import Link from "next/link";
import { useCartLines } from "@/components/cart/cart-store";
import { BagIcon } from "@/components/icons";

export function CartLink() {
  const lines = useCartLines();
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  return (
    <Link
      href="/carrito"
      className="relative inline-flex min-h-11 min-w-11 items-center justify-center gap-2 px-1 text-ink"
      aria-label={`Carrito, ${count} ${count === 1 ? "artículo" : "artículos"}`}
    >
      <BagIcon size={22} />
      <span className="label-caps hidden text-[0.6875rem] md:inline">Carrito</span>
      {count > 0 ? (
        <span className="absolute right-0 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-fir px-1 text-[0.625rem] font-medium text-white md:static md:ml-[-4px]">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
