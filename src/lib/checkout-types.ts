import type { FieldErrors } from "./validation";

export type CheckoutResult =
  | { ok: true; redirectUrl: string }
  | {
      ok: false;
      message: string;
      fieldErrors?: FieldErrors;
      /** Product ids whose availability changed; the cart should refresh them. */
      unavailableProductIds?: string[];
    };
