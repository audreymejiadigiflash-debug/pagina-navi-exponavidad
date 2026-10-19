"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type Path } from "react-hook-form";
import { saveSettings } from "@/app/admin/actions";
import { FormField } from "@/components/checkout/form-field";
import type { StoreSettings } from "@/lib/types";
import { settingsFormSchema, type SettingsFormInput, type SettingsFormOutput } from "@/lib/validation";

const pesos = (cents: number | null) => (cents === null ? "" : String(cents / 100));

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormInput, unknown, SettingsFormOutput>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      shippingFlat: pesos(settings.shippingFlatCents),
      freeShippingThreshold: pesos(settings.freeShippingThresholdCents),
      promoText: settings.promoText,
      businessName: settings.businessName,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      businessAddress: settings.businessAddress,
    },
    mode: "onTouched",
  });

  const input = (name: Path<SettingsFormInput>, describedBy: string | undefined) => ({
    id: `settings-${name}`,
    ...register(name),
    className: "input",
    "aria-describedby": describedBy,
    "aria-invalid": Boolean(errors[name]),
  });

  return (
    <form
      noValidate
      className="space-y-8"
      onSubmit={handleSubmit(async () => {
        setFeedback(null);
        // The server re-validates the raw text input, so send it untransformed.
        const result = await saveSettings(getValues());
        if (!result.ok) {
          setFeedback({ tone: "error", text: result.message });
          for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
            setError(field as Path<SettingsFormInput>, { message });
          }
          return;
        }
        setFeedback({ tone: "ok", text: "Configuración guardada. La tienda ya muestra los cambios." });
        router.refresh();
      })}
    >
      <fieldset className="grid gap-5 border border-line bg-white p-5 md:grid-cols-2">
        <legend className="px-1 text-[0.8125rem] font-medium">Envío</legend>
        <FormField
          id="settings-shippingFlat"
          label="Costo de envío por pedido (MXN)"
          hint="Escribe 0 si el envío siempre es gratis."
          error={errors.shippingFlat?.message}
        >
          {(describedBy) => <input {...input("shippingFlat", describedBy)} inputMode="decimal" />}
        </FormField>
        <FormField
          id="settings-freeShippingThreshold"
          label="Envío gratis a partir de (MXN)"
          optional
          hint="Déjalo vacío si no ofreces envío gratis."
          error={errors.freeShippingThreshold?.message}
        >
          {(describedBy) => <input {...input("freeShippingThreshold", describedBy)} inputMode="decimal" />}
        </FormField>
      </fieldset>

      <fieldset className="grid gap-5 border border-line bg-white p-5 md:grid-cols-2">
        <legend className="px-1 text-[0.8125rem] font-medium">Tienda</legend>
        <FormField
          id="settings-promoText"
          label="Texto de la barra superior"
          optional
          hint="Ej. Colección Navidad 2026"
          error={errors.promoText?.message}
          className="md:col-span-2"
        >
          {(describedBy) => <input {...input("promoText", describedBy)} maxLength={120} />}
        </FormField>
        <FormField id="settings-businessName" label="Nombre del negocio" error={errors.businessName?.message}>
          {(describedBy) => <input {...input("businessName", describedBy)} />}
        </FormField>
        <FormField id="settings-contactEmail" label="Correo de contacto" optional error={errors.contactEmail?.message}>
          {(describedBy) => <input {...input("contactEmail", describedBy)} type="email" inputMode="email" />}
        </FormField>
        <FormField id="settings-contactPhone" label="Teléfono de contacto" optional error={errors.contactPhone?.message}>
          {(describedBy) => <input {...input("contactPhone", describedBy)} type="tel" inputMode="tel" />}
        </FormField>
        <FormField
          id="settings-businessAddress"
          label="Dirección del negocio"
          optional
          hint="Aparece en el pie de página y en el aviso de privacidad."
          error={errors.businessAddress?.message}
        >
          {(describedBy) => <input {...input("businessAddress", describedBy)} />}
        </FormField>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "Guardando…" : "Guardar configuración"}
        </button>
        <span aria-live="polite" className={`text-[0.875rem] ${feedback?.tone === "error" ? "text-error" : "text-success"}`}>
          {feedback?.text}
        </span>
      </div>
    </form>
  );
}
