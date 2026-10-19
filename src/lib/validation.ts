import { z } from "zod";
import {
  ADMIN_SETTABLE_STATUSES,
  MAX_PRODUCT_IMAGES,
  MAX_PRODUCT_VARIANTS,
  MAX_QUANTITY_PER_ITEM,
  MEXICAN_STATES,
} from "./constants";
import { ATTRIBUTE_KEYS, PRODUCT_BADGES } from "./types";

const requiredText = (message: string, max = 120) =>
  z.string().trim().min(1, message).max(max, `Máximo ${max} caracteres.`);

/* ---------------------------------------------------------------------------
 * Checkout
 * ------------------------------------------------------------------------- */
export const checkoutCustomerSchema = z.object({
  name: requiredText("Escribe tu nombre completo.").min(3, "Escribe tu nombre completo."),
  email: z.string().trim().toLowerCase().email("Escribe un correo electrónico válido.").max(160),
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s()-]/g, ""))
    .pipe(z.string().regex(/^\+?\d{10,13}$/, "Escribe un teléfono de 10 dígitos.")),
  street: requiredText("Escribe la calle."),
  exteriorNumber: requiredText("Escribe el número exterior.", 20),
  interiorNumber: z.string().trim().max(20, "Máximo 20 caracteres.").default(""),
  neighborhood: requiredText("Escribe la colonia."),
  city: requiredText("Escribe la ciudad o municipio."),
  state: z.enum(MEXICAN_STATES, { message: "Elige un estado." }),
  postalCode: z.string().trim().regex(/^\d{5}$/, "El código postal debe tener 5 dígitos."),
  references: z.string().trim().max(240, "Máximo 240 caracteres.").default(""),
  acceptTerms: z.literal(true, { message: "Debes aceptar los términos y el aviso de privacidad." }),
});

export type CheckoutCustomerInput = z.input<typeof checkoutCustomerSchema>;
export type CheckoutCustomer = z.output<typeof checkoutCustomerSchema>;

export const cartLinesSchema = z
  .array(
    z.object({
      productId: z.string().min(1).max(80),
      variantId: z.string().min(1).max(80).nullish().transform((value) => value ?? null),
      quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_ITEM),
    }),
  )
  .min(1, "Tu carrito está vacío.")
  .max(50);

/* ---------------------------------------------------------------------------
 * Admin: products
 * ------------------------------------------------------------------------- */
const moneyField = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .transform((value) => Number(value.replace(/[$,\s]/g, "")))
    .pipe(z.number({ message: "Escribe un número válido." }).positive("Debe ser mayor a 0.").max(1_000_000));

const optionalMoneyField = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : Number(value.replace(/[$,\s]/g, ""))))
  .pipe(z.number({ message: "Escribe un número válido." }).positive("Debe ser mayor a 0.").max(1_000_000).nullable());

const stockField = z
  .string()
  .trim()
  .min(1, "Escribe cuántas piezas tienes.")
  .transform(Number)
  .pipe(z.number({ message: "Escribe un número entero." }).int("Escribe un número entero.").min(0, "No puede ser negativo.").max(100_000));

const variantFormSchema = z
  .object({
    /** Empty for a size added in this edit. */
    id: z.string().max(80),
    label: requiredText("Escribe la medida.", 40),
    price: moneyField("Escribe el precio."),
    salePrice: optionalMoneyField,
    stock: stockField,
  })
  .refine((data) => data.salePrice === null || data.salePrice < data.price, {
    message: "Debe ser menor que el precio.",
    path: ["salePrice"],
  });

const SINGLE_PRICE_FIELDS = { price: moneyField("Escribe el precio."), salePrice: optionalMoneyField, stock: stockField };

/*
 * A product is sold either at one price (price, salePrice, stock) or in several sizes
 * (variants). The single-price fields are only validated when there are no sizes.
 */
export const productFormSchema = z
  .object({
    name: requiredText("Escribe el nombre del producto.", 140).min(2, "Escribe el nombre del producto."),
    categoryId: z.string().min(1, "Elige una categoría."),
    description: z.string().trim().max(2000, "Máximo 2000 caracteres."),
    price: z.string(),
    salePrice: z.string(),
    stock: z.string(),
    variants: z.array(variantFormSchema).max(MAX_PRODUCT_VARIANTS, `Máximo ${MAX_PRODUCT_VARIANTS} medidas.`),
    badge: z.enum(["", ...PRODUCT_BADGES]),
    featured: z.boolean(),
    published: z.boolean(),
    images: z.array(z.string().min(1).max(600)).max(MAX_PRODUCT_IMAGES, `Máximo ${MAX_PRODUCT_IMAGES} fotos.`),
    attributes: z.object(
      Object.fromEntries(ATTRIBUTE_KEYS.map((key) => [key, z.string().trim().max(60, "Máximo 60 caracteres.")])) as Record<
        (typeof ATTRIBUTE_KEYS)[number],
        z.ZodString
      >,
    ),
  })
  .superRefine((data, context) => {
    if (data.variants.length) {
      const seen = new Set<string>();
      data.variants.forEach((variant, index) => {
        const label = variant.label.toLowerCase();
        if (seen.has(label)) context.addIssue({ code: "custom", message: "Esta medida está repetida.", path: ["variants", index, "label"] });
        seen.add(label);
      });
      return;
    }
    for (const [field, schema] of Object.entries(SINGLE_PRICE_FIELDS)) {
      const result = schema.safeParse(data[field as keyof typeof SINGLE_PRICE_FIELDS]);
      if (!result.success) context.addIssue({ code: "custom", message: result.error.issues[0].message, path: [field] });
    }
    const price = SINGLE_PRICE_FIELDS.price.safeParse(data.price);
    const salePrice = SINGLE_PRICE_FIELDS.salePrice.safeParse(data.salePrice);
    if (price.success && salePrice.success && salePrice.data !== null && salePrice.data >= price.data) {
      context.addIssue({ code: "custom", message: "El precio de oferta debe ser menor que el precio normal.", path: ["salePrice"] });
    }
  })
  .transform(({ price, salePrice, stock, ...rest }) => ({
    ...rest,
    // Already validated above, so parse() cannot throw here.
    single: rest.variants.length
      ? null
      : {
          price: SINGLE_PRICE_FIELDS.price.parse(price),
          salePrice: SINGLE_PRICE_FIELDS.salePrice.parse(salePrice),
          stock: SINGLE_PRICE_FIELDS.stock.parse(stock),
        },
  }));

export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormValues = z.output<typeof productFormSchema>;

/* ---------------------------------------------------------------------------
 * Admin: settings and orders
 * ------------------------------------------------------------------------- */
export const settingsFormSchema = z.object({
  shippingFlat: z
    .string()
    .trim()
    .min(1, "Escribe el costo de envío (0 si es gratis).")
    .transform((value) => Number(value.replace(/[$,\s]/g, "")))
    .pipe(z.number({ message: "Escribe un número válido." }).min(0, "No puede ser negativo.").max(100_000)),
  freeShippingThreshold: optionalMoneyField,
  promoText: z.string().trim().max(120, "Máximo 120 caracteres."),
  businessName: requiredText("Escribe el nombre del negocio."),
  contactEmail: z.union([z.literal(""), z.string().trim().email("Escribe un correo válido.")]),
  contactPhone: z.string().trim().max(30, "Máximo 30 caracteres."),
  businessAddress: z.string().trim().max(240, "Máximo 240 caracteres."),
});

export type SettingsFormInput = z.input<typeof settingsFormSchema>;
export type SettingsFormOutput = z.output<typeof settingsFormSchema>;

export const orderUpdateSchema = z.object({
  status: z.enum(ADMIN_SETTABLE_STATUSES as [string, ...string[]], { message: "Elige un estado válido." }).optional(),
  trackingNumber: z.string().trim().max(80, "Máximo 80 caracteres."),
  adminNotes: z.string().trim().max(1000, "Máximo 1000 caracteres."),
});

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */
export type FieldErrors = Record<string, string>;

export function flattenZodErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
