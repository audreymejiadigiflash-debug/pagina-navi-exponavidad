"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useFieldArray, useForm, useWatch, type Path } from "react-hook-form";
import { deleteProduct, saveProduct } from "@/app/admin/actions";
import { FormField } from "@/components/checkout/form-field";
import {
  ATTRIBUTE_CATEGORIES,
  ATTRIBUTE_LABELS,
  ATTRIBUTE_SUGGESTIONS,
  BADGE_LABELS,
  MAX_PRODUCT_VARIANTS,
} from "@/lib/constants";
import { ATTRIBUTE_KEYS, PRODUCT_BADGES, type Category, type Product } from "@/lib/types";
import { productFormSchema, type ProductFormInput, type ProductFormValues } from "@/lib/validation";
import { variantAttributeFor } from "@/lib/variants";
import { ImageUploader } from "./image-uploader";

type ProductFormProps = {
  product: Product | null;
  categories: Category[];
};

const centsToInput = (cents: number | null) => (cents === null ? "" : String(cents / 100));

function defaultValues(product: Product | null, categories: Category[]): ProductFormInput {
  return {
    name: product?.name ?? "",
    categoryId: product?.categoryId ?? categories[0]?.id ?? "",
    description: product?.description ?? "",
    price: product ? centsToInput(product.priceCents) : "",
    salePrice: product ? centsToInput(product.salePriceCents) : "",
    stock: product ? String(product.stock) : "",
    variants: (product?.variants ?? []).map((variant) => ({
      id: variant.id,
      label: variant.label,
      price: centsToInput(variant.priceCents),
      salePrice: centsToInput(variant.salePriceCents),
      stock: String(variant.stock),
    })),
    badge: product?.badge ?? "",
    featured: product?.featured ?? false,
    published: product?.published ?? true,
    images: product?.images ?? [],
    attributes: Object.fromEntries(ATTRIBUTE_KEYS.map((key) => [key, product?.attributes[key] ?? ""])) as ProductFormInput["attributes"],
  };
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaultValues(product, categories),
    mode: "onTouched",
  });
  const categoryId = useWatch({ control, name: "categoryId" });
  const { fields: variantFields, append: appendVariant, remove: removeVariant, replace: replaceVariants } = useFieldArray({
    control,
    name: "variants",
  });
  const hasSizes = variantFields.length > 0;

  const toggleSizes = (enabled: boolean) => {
    if (enabled) {
      // The current single price becomes the first size, so nothing typed is lost.
      appendVariant({ id: "", label: "", price: getValues("price"), salePrice: getValues("salePrice"), stock: getValues("stock") });
      return;
    }
    if (window.confirm("¿Quitar todas las medidas? El producto se venderá a un solo precio.")) replaceVariants([]);
  };

  // The client validates for instant feedback; the server re-validates the raw form input.
  const onSubmit = async () => {
    setServerError("");
    setSaved(false);
    const result = await saveProduct(product?.id ?? null, getValues());
    if (!result.ok) {
      setServerError(result.message);
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        setError(field as Path<ProductFormInput>, { message });
      }
      return;
    }
    setSaved(true);
    if (!product) router.push(`/admin/productos/${result.data.id}?nuevo=1`);
    else router.refresh();
  };

  const onDelete = async () => {
    if (!product || !window.confirm(`¿Eliminar “${product.name}”? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    const result = await deleteProduct(product.id);
    if (!result.ok) {
      setServerError(result.message);
      setDeleting(false);
      return;
    }
    router.push("/admin/productos");
    router.refresh();
  };

  const busy = isSubmitting || uploading || deleting;
  const input = (name: Path<ProductFormInput>, describedBy: string | undefined) => ({
    id: `product-${name}`,
    ...register(name),
    className: "input",
    "aria-describedby": describedBy,
    "aria-invalid": Boolean(name.split(".").reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], errors)),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      <div className="grid gap-5 border border-line bg-white p-5 md:grid-cols-2">
        <FormField id="product-name" label="Nombre del producto" error={errors.name?.message} className="md:col-span-2">
          {(describedBy) => <input {...input("name", describedBy)} placeholder="Ej. Abeto Nórdico 2.10 m con luces LED" />}
        </FormField>
        <FormField id="product-categoryId" label="Categoría" error={errors.categoryId?.message}>
          {(describedBy) => (
            <select {...input("categoryId", describedBy)}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
        </FormField>
        <FormField id="product-badge" label="Etiqueta" optional error={errors.badge?.message}>
          {(describedBy) => (
            <select {...input("badge", describedBy)}>
              <option value="">Sin etiqueta</option>
              {PRODUCT_BADGES.map((badge) => (
                <option key={badge} value={badge}>
                  {BADGE_LABELS[badge]}
                </option>
              ))}
            </select>
          )}
        </FormField>
        <FormField id="product-description" label="Descripción" optional error={errors.description?.message} className="md:col-span-2">
          {(describedBy) => (
            <textarea
              {...input("description", describedBy)}
              rows={5}
              placeholder="Materiales, medidas, cómo se arma, para qué espacio es ideal…"
            />
          )}
        </FormField>
      </div>

      <fieldset className="border border-line bg-white p-5">
        <legend className="px-1 text-[0.8125rem] font-medium">Precio e inventario</legend>
        <label className="flex min-h-10 cursor-pointer items-center gap-3 text-[0.925rem]">
          <input
            type="checkbox"
            className="checkbox"
            checked={hasSizes}
            onChange={(event) => toggleSizes(event.target.checked)}
          />
          Se vende en varias medidas
        </label>
        <p className="field-hint mt-1">
          Actívalo si el modelo tiene varias medidas (por ejemplo 1.90, 2.20 y 2.50 m). En la tienda aparece como un
          solo producto y el cliente elige la medida en un menú.
        </p>

        {hasSizes ? (
          <div className="mt-5 space-y-4">
            {variantFields.map((field, index) => (
              <div key={field.id} className="grid gap-4 border border-line p-4 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto] lg:items-start">
                <input type="hidden" {...register(`variants.${index}.id`)} />
                <FormField id={`product-variants.${index}.label`} label="Medida" error={errors.variants?.[index]?.label?.message}>
                  {(describedBy) => <input {...input(`variants.${index}.label`, describedBy)} placeholder="Ej. 1.90 m" />}
                </FormField>
                <FormField id={`product-variants.${index}.price`} label="Precio (MXN)" error={errors.variants?.[index]?.price?.message}>
                  {(describedBy) => <input {...input(`variants.${index}.price`, describedBy)} inputMode="decimal" />}
                </FormField>
                <FormField
                  id={`product-variants.${index}.salePrice`}
                  label="Oferta"
                  optional
                  error={errors.variants?.[index]?.salePrice?.message}
                >
                  {(describedBy) => <input {...input(`variants.${index}.salePrice`, describedBy)} inputMode="decimal" />}
                </FormField>
                <FormField id={`product-variants.${index}.stock`} label="Piezas" error={errors.variants?.[index]?.stock?.message}>
                  {(describedBy) => <input {...input(`variants.${index}.stock`, describedBy)} inputMode="numeric" />}
                </FormField>
                <button
                  type="button"
                  className="label-caps min-h-11 text-[0.6875rem] text-ink-soft underline underline-offset-4 hover:text-error disabled:opacity-40 lg:mt-7"
                  onClick={() => removeVariant(index)}
                  disabled={variantFields.length === 1}
                  aria-label={`Quitar medida ${index + 1}`}
                >
                  Quitar
                </button>
              </div>
            ))}
            {errors.variants?.message ? <p className="field-error">{errors.variants.message}</p> : null}
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => appendVariant({ id: "", label: "", price: "", salePrice: "", stock: "" })}
              disabled={variantFields.length >= MAX_PRODUCT_VARIANTS}
            >
              Agregar medida
            </button>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <FormField id="product-price" label="Precio (MXN, IVA incluido)" error={errors.price?.message}>
              {(describedBy) => <input {...input("price", describedBy)} inputMode="decimal" placeholder="Ej. 2499" />}
            </FormField>
            <FormField
              id="product-salePrice"
              label="Precio de oferta"
              optional
              hint="Déjalo vacío si no está en oferta."
              error={errors.salePrice?.message}
            >
              {(describedBy) => <input {...input("salePrice", describedBy)} inputMode="decimal" />}
            </FormField>
            <FormField
              id="product-stock"
              label="Piezas en inventario"
              hint="Se descuenta sola con cada venta pagada. Con 0 aparece como agotado."
              error={errors.stock?.message}
            >
              {(describedBy) => <input {...input("stock", describedBy)} inputMode="numeric" />}
            </FormField>
          </div>
        )}
      </fieldset>

      <Controller
        control={control}
        name="images"
        render={({ field, fieldState }) => (
          <ImageUploader
            images={field.value}
            onChange={(images) => field.onChange(images)}
            error={fieldState.error?.message}
            onBusyChange={setUploading}
          />
        )}
      />

      <fieldset className="border border-line bg-white p-5">
        <legend className="px-1 text-[0.8125rem] font-medium">Características</legend>
        <p className="field-hint mt-0">Opcionales. Las que llenes aparecen en el producto y como filtros en la tienda.</p>
        <div className="mt-4 grid gap-5 md:grid-cols-3">
          {ATTRIBUTE_KEYS.filter((key) => {
            const allowed = ATTRIBUTE_CATEGORIES[key];
            // With sizes, the size list already covers this characteristic.
            if (hasSizes && key === variantAttributeFor(categoryId)) return false;
            return !allowed || allowed.includes(categoryId);
          }).map((key) => (
            <FormField key={key} id={`product-attributes.${key}`} label={ATTRIBUTE_LABELS[key]} error={errors.attributes?.[key]?.message}>
              {(describedBy) => (
                <>
                  <input {...input(`attributes.${key}`, describedBy)} list={ATTRIBUTE_SUGGESTIONS[key] ? `suggest-${key}` : undefined} />
                  {ATTRIBUTE_SUGGESTIONS[key] ? (
                    <datalist id={`suggest-${key}`}>
                      {ATTRIBUTE_SUGGESTIONS[key]?.map((value) => <option key={value} value={value} />)}
                    </datalist>
                  ) : null}
                </>
              )}
            </FormField>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2 border border-line bg-white p-5">
        <legend className="px-1 text-[0.8125rem] font-medium">Visibilidad</legend>
        <label className="flex min-h-10 cursor-pointer items-center gap-3 text-[0.925rem]">
          <input type="checkbox" className="checkbox" {...register("published")} />
          Publicado en la tienda
        </label>
        <label className="flex min-h-10 cursor-pointer items-center gap-3 text-[0.925rem]">
          <input type="checkbox" className="checkbox" {...register("featured")} />
          Mostrar en “Lo más elegido” del inicio
        </label>
      </fieldset>

      <div aria-live="polite">
        {serverError ? (
          <p role="alert" className="border border-error/30 bg-white px-4 py-3 text-[0.9rem] text-error">
            {serverError}
          </p>
        ) : null}
        {saved && !isDirty ? (
          <p className="border border-success/30 bg-white px-4 py-3 text-[0.9rem] text-success">Cambios guardados.</p>
        ) : null}
      </div>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-ivory/95 px-4 py-4 backdrop-blur md:mx-0 md:px-0">
        {product ? (
          <button type="button" className="btn btn-danger btn-sm" onClick={onDelete} disabled={busy}>
            {deleting ? "Eliminando…" : "Eliminar producto"}
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-3">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => router.push("/admin/productos")} disabled={busy}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy} aria-busy={isSubmitting}>
            {isSubmitting ? "Guardando…" : uploading ? "Subiendo fotos…" : product ? "Guardar cambios" : "Crear producto"}
          </button>
        </div>
      </div>
    </form>
  );
}
