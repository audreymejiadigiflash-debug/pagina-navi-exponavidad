"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon } from "@/components/icons";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/constants";
import { cartActions, cartLineKey, useCartLines } from "./cart-store";
import { QuantityStepper } from "./quantity-stepper";

type AddToCartProps = {
  productId: string;
  variantId: string | null;
  productName: string;
  stock: number;
};

export function AddToCart({ productId, variantId, productName, stock }: AddToCartProps) {
  const lines = useCartLines();
  const key = cartLineKey({ productId, variantId });
  const inCart = lines.find((line) => cartLineKey(line) === key)?.quantity ?? 0;
  const maxAddable = Math.max(0, Math.min(stock, MAX_QUANTITY_PER_ITEM) - inCart);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (stock <= 0) {
    return (
      <button type="button" className="btn btn-outline w-full" disabled>
        Agotado
      </button>
    );
  }

  const safeQuantity = Math.min(quantity, Math.max(maxAddable, 1));

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <QuantityStepper
          value={safeQuantity}
          max={Math.max(maxAddable, 1)}
          onChange={(value) => {
            setQuantity(value);
            setAdded(false);
          }}
          label="Cantidad"
        />
        <button
          type="button"
          className="btn btn-primary flex-1"
          disabled={maxAddable === 0}
          onClick={() => {
            cartActions.add(productId, variantId, safeQuantity);
            setQuantity(1);
            setAdded(true);
          }}
        >
          Añadir al carrito
        </button>
      </div>
      {maxAddable === 0 ? (
        <p className="text-[0.875rem] text-ink-soft">Ya tienes en tu carrito todas las piezas disponibles.</p>
      ) : null}
      <div aria-live="polite">
        {added ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-ivory px-4 py-3">
            <p className="flex items-center gap-2 text-[0.9rem]">
              <CheckIcon size={18} className="text-success" />
              Añadiste {productName} a tu carrito.
            </p>
            <Link href="/carrito" className="label-caps link-underline text-[0.6875rem]">
              Ver carrito
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
