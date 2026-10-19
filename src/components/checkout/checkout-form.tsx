"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, type Path } from "react-hook-form";
import { startCheckout } from "@/app/(store)/checkout/actions";
import type { CartProduct, ShippingRules } from "@/components/cart/cart-types";
import { OrderSummary } from "@/components/cart/order-summary";
import { useCartSummary } from "@/components/cart/use-cart-summary";
import { ShieldIcon } from "@/components/icons";
import { MEXICAN_STATES } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { checkoutCustomerSchema, type CheckoutCustomer, type CheckoutCustomerInput } from "@/lib/validation";
import { FormField } from "./form-field";

type CheckoutFormProps = {
  products: CartProduct[];
  shipping: ShippingRules;
};

export function CheckoutForm({ products, shipping }: CheckoutFormProps) {
  const summary = useCartSummary(products, shipping);
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [isRedirecting, startRedirect] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutCustomerInput, unknown, CheckoutCustomer>({
    resolver: zodResolver(checkoutCustomerSchema),
    defaultValues: { interiorNumber: "", references: "", state: undefined },
    mode: "onTouched",
  });

  const busy = isSubmitting || isRedirecting;

  if (!summary.hydrated) {
    return <div className="h-96 animate-pulse bg-ivory" aria-busy="true" aria-label="Cargando tu pedido" />;
  }

  if (!summary.lines.length) {
    return (
      <div className="border border-line px-6 py-20 text-center">
        <h2 className="text-[2rem]">No hay productos para pagar</h2>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">Tu carrito está vacío.</p>
        <Link href="/tienda" className="btn btn-primary mt-8">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  const onSubmit = async (customer: CheckoutCustomer) => {
    setServerError("");
    const result = await startCheckout({
      customer,
      lines: summary.lines.map((line) => ({
        productId: line.product.productId,
        variantId: line.product.variantId,
        quantity: line.quantity,
      })),
    });
    if (result.ok) {
      // Mercado Pago's checkout lives on its own domain, so this is a full page navigation.
      startRedirect(() => window.location.assign(result.redirectUrl));
      return;
    }
    setServerError(result.message);
    for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
      setError(field as Path<CheckoutCustomerInput>, { message });
    }
    if (result.unavailableProductIds?.length) router.refresh();
  };

  const fieldProps = (name: Path<CheckoutCustomerInput>, describedBy: string | undefined) => ({
    id: `checkout-${name}`,
    ...register(name),
    "aria-invalid": Boolean(errors[name as keyof typeof errors]),
    "aria-describedby": describedBy,
    className: "input",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-10 lg:grid-cols-[1fr_420px] lg:gap-14">
      <div className="space-y-12">
        <fieldset>
          <legend className="font-serif text-[1.9rem]">Contacto</legend>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <FormField id="checkout-name" label="Nombre completo" error={errors.name?.message} className="md:col-span-2">
              {(describedBy) => <input {...fieldProps("name", describedBy)} autoComplete="name" />}
            </FormField>
            <FormField
              id="checkout-email"
              label="Correo electrónico"
              error={errors.email?.message}
              hint="Lo usaremos para contactarte sobre tu pedido."
            >
              {(describedBy) => (
                <input {...fieldProps("email", describedBy)} type="email" autoComplete="email" inputMode="email" />
              )}
            </FormField>
            <FormField id="checkout-phone" label="Teléfono" error={errors.phone?.message} hint="10 dígitos, para coordinar la entrega.">
              {(describedBy) => (
                <input {...fieldProps("phone", describedBy)} type="tel" autoComplete="tel-national" inputMode="tel" />
              )}
            </FormField>
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-serif text-[1.9rem]">Dirección de envío</legend>
          <div className="mt-6 grid gap-5 md:grid-cols-6">
            <FormField id="checkout-street" label="Calle" error={errors.street?.message} className="md:col-span-6">
              {(describedBy) => <input {...fieldProps("street", describedBy)} autoComplete="address-line1" />}
            </FormField>
            <FormField
              id="checkout-exteriorNumber"
              label="Número exterior"
              error={errors.exteriorNumber?.message}
              className="md:col-span-3"
            >
              {(describedBy) => <input {...fieldProps("exteriorNumber", describedBy)} />}
            </FormField>
            <FormField
              id="checkout-interiorNumber"
              label="Número interior"
              optional
              error={errors.interiorNumber?.message}
              className="md:col-span-3"
            >
              {(describedBy) => <input {...fieldProps("interiorNumber", describedBy)} autoComplete="address-line2" />}
            </FormField>
            <FormField id="checkout-neighborhood" label="Colonia" error={errors.neighborhood?.message} className="md:col-span-3">
              {(describedBy) => <input {...fieldProps("neighborhood", describedBy)} autoComplete="address-level3" />}
            </FormField>
            <FormField id="checkout-postalCode" label="Código postal" error={errors.postalCode?.message} className="md:col-span-3">
              {(describedBy) => (
                <input
                  {...fieldProps("postalCode", describedBy)}
                  autoComplete="postal-code"
                  inputMode="numeric"
                  maxLength={5}
                />
              )}
            </FormField>
            <FormField id="checkout-city" label="Ciudad o municipio" error={errors.city?.message} className="md:col-span-3">
              {(describedBy) => <input {...fieldProps("city", describedBy)} autoComplete="address-level2" />}
            </FormField>
            <FormField id="checkout-state" label="Estado" error={errors.state?.message} className="md:col-span-3">
              {(describedBy) => (
                <select {...fieldProps("state", describedBy)} autoComplete="address-level1" defaultValue="">
                  <option value="" disabled>
                    Elige un estado
                  </option>
                  {MEXICAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              )}
            </FormField>
            <FormField
              id="checkout-references"
              label="Referencias para la entrega"
              optional
              error={errors.references?.message}
              hint="Entre calles, color de fachada, horario preferido…"
              className="md:col-span-6"
            >
              {(describedBy) => <textarea {...fieldProps("references", describedBy)} rows={3} />}
            </FormField>
          </div>
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-[200px] lg:self-start">
        <OrderSummary
          subtotalCents={summary.subtotalCents}
          shippingCents={summary.shippingCents}
          totalCents={summary.totalCents}
          shipping={shipping}
        >
          <ul className="mt-6 space-y-4 border-t border-line pt-6">
            {summary.lines.map(({ product, quantity, lineTotalCents }) => (
              <li key={product.key} className="flex items-center gap-4 text-[0.875rem]">
                <span className="relative block aspect-[4/5] w-14 shrink-0 overflow-hidden bg-white">
                  {product.imageUrl ? <Image src={product.imageUrl} alt="" fill sizes="56px" className="object-cover" /> : null}
                </span>
                <span className="flex-1">
                  {product.name}
                  {product.variantLabel ? <span className="block text-ink-soft">{product.variantLabel}</span> : null}
                  <span className="block text-ink-soft">Cantidad: {quantity}</span>
                </span>
                <span>{formatPrice(lineTotalCents)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-line pt-6">
            <label className="flex cursor-pointer items-start gap-3 text-[0.875rem] text-ink-soft">
              <input
                type="checkbox"
                className="checkbox mt-0.5"
                {...register("acceptTerms")}
                aria-invalid={Boolean(errors.acceptTerms)}
                aria-describedby={errors.acceptTerms ? "checkout-terms-error" : undefined}
              />
              <span>
                Acepto los{" "}
                <Link href="/terminos-y-condiciones" target="_blank" className="link-underline text-ink">
                  términos y condiciones
                </Link>{" "}
                y el{" "}
                <Link href="/aviso-de-privacidad" target="_blank" className="link-underline text-ink">
                  aviso de privacidad
                </Link>
                .
              </span>
            </label>
            {errors.acceptTerms ? (
              <p id="checkout-terms-error" className="field-error">
                {errors.acceptTerms.message}
              </p>
            ) : null}
          </div>

          {serverError ? (
            <p role="alert" className="mt-6 border border-error/30 bg-white px-4 py-3 text-[0.875rem] text-error">
              {serverError}
            </p>
          ) : null}

          <button type="submit" className="btn btn-primary mt-6 w-full" disabled={busy} aria-busy={busy}>
            {busy ? "Preparando tu pago…" : `Pagar ${formatPrice(summary.totalCents)}`}
          </button>
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-[0.8125rem] text-ink-soft">
            <ShieldIcon size={16} className="shrink-0 text-gold-ink" />
            Serás dirigido a Mercado Pago para pagar de forma segura.
          </p>
        </OrderSummary>
      </aside>
    </form>
  );
}
