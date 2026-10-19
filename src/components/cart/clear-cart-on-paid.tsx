"use client";

import { useEffect } from "react";
import { cartActions } from "./cart-store";

/** Empties the cart once the order shown on screen has been paid. */
export function ClearCartOnPaid() {
  useEffect(() => {
    cartActions.clear();
  }, []);
  return null;
}
