import type { AttributeKey, OrderStatus, ProductBadge } from "./types";

export const STORE_NAME = "NaviExpoNavidad";
export const CURRENCY = "MXN";
export const LOCALE = "es-MX";
export const MAX_QUANTITY_PER_ITEM = 20;
export const MAX_PRODUCT_IMAGES = 6;
export const MAX_PRODUCT_VARIANTS = 12;
export const PRODUCT_IMAGES_BUCKET = "product-images";
/** Store WhatsApp in international format (52 = Mexico), as wa.me expects. */
export const WHATSAPP_NUMBER = "525518441321";
export const WHATSAPP_GREETING = "Hola, vengo de la tienda en línea de NaviExpoNavidad y tengo una pregunta.";

export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  altura: "Altura",
  forma: "Forma",
  luz: "Tipo de luz",
  color: "Color",
  material: "Material",
  piezas: "Piezas",
  medidas: "Medidas",
};

/** Attributes offered as catalog filters, in display order. */
export const FILTERABLE_ATTRIBUTES: AttributeKey[] = ["altura", "luz", "forma", "color"];

/** Attributes that only apply to some categories (the rest apply to all). */
export const ATTRIBUTE_CATEGORIES: Partial<Record<AttributeKey, string[]>> = {
  altura: ["arboles"],
  forma: ["arboles"],
  luz: ["arboles", "luces", "coronas"],
};

export const ATTRIBUTE_SUGGESTIONS: Partial<Record<AttributeKey, string[]>> = {
  altura: ["1.20 m", "1.50 m", "1.80 m", "2.10 m", "2.40 m", "2.70 m", "3.00 m"],
  forma: ["Completo", "Slim", "Lápiz"],
  luz: ["Sin luz", "LED blanco cálido", "LED blanco frío", "LED multicolor", "LED cambio de color"],
  color: ["Verde", "Verde nevado", "Blanco", "Dorado", "Plateado", "Rojo", "Champaña", "Natural", "Multicolor", "Rosa"],
  material: ["Vidrio", "Plástico irrompible", "Madera", "Metal", "Tela"],
};

export const BADGE_LABELS: Record<ProductBadge, string> = {
  nuevo: "Novedad",
  "mas-vendido": "Más vendido",
  "edicion-limitada": "Edición limitada",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Pendiente de pago",
  paid: "Pagado",
  preparing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  payment_failed: "Pago rechazado",
};

/** Statuses the admin can set by hand once an order exists. */
export const ADMIN_SETTABLE_STATUSES: OrderStatus[] = ["paid", "preparing", "shipped", "delivered", "cancelled"];

export const MEXICAN_STATES = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Coahuila",
  "Colima",
  "Durango",
  "Estado de México",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
] as const;
