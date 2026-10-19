export const ATTRIBUTE_KEYS = ["altura", "forma", "luz", "color", "material", "piezas", "medidas"] as const;
export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];
export type ProductAttributes = Partial<Record<AttributeKey, string>>;

export const PRODUCT_BADGES = ["nuevo", "mas-vendido", "edicion-limitada"] as const;
export type ProductBadge = (typeof PRODUCT_BADGES)[number];

export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "payment_failed",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type Category = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  imageUrl: string | null;
  sortOrder: number;
};

/** A purchasable size of a product. Products without variants are sold as a single item. */
export type ProductVariant = {
  id: string;
  label: string;
  priceCents: number;
  salePriceCents: number | null;
  stock: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  description: string;
  priceCents: number;
  salePriceCents: number | null;
  stock: number;
  images: string[];
  badge: ProductBadge | null;
  featured: boolean;
  published: boolean;
  attributes: ProductAttributes;
  /** Empty for single-size products. When present, price and stock above summarize the variants. */
  variants: ProductVariant[];
  createdAt: string;
};

export type StoreSettings = {
  shippingFlatCents: number;
  freeShippingThresholdCents: number | null;
  promoText: string;
  businessName: string;
  contactEmail: string;
  contactPhone: string;
  businessAddress: string;
};

export type OrderItem = {
  productId: string | null;
  variantLabel: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

export type Order = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingStreet: string;
  shippingExteriorNumber: string;
  shippingInteriorNumber: string;
  shippingNeighborhood: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingReferences: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  mpPaymentId: string | null;
  mpPaymentStatus: string | null;
  trackingNumber: string;
  adminNotes: string;
  paidAt: string | null;
  createdAt: string;
  items: OrderItem[];
};
