import type { Category, Product, ProductVariant, StoreSettings } from "./types";
import { withVariantSummary } from "./variants";

/*
 * Starter catalog. It is shown while Supabase is not configured, and the admin
 * panel can load it into the database. Only the store's real products live here.
 */

export const DEMO_CATEGORIES: Category[] = [
  {
    id: "arboles",
    name: "Árboles de Navidad",
    shortName: "Árboles",
    description: "Abetos y pinos de follaje realista, con o sin luces integradas, en todas las alturas.",
    imageUrl: "/images/categorias/arboles.webp",
    sortOrder: 1,
  },
  {
    id: "esferas",
    name: "Esferas",
    shortName: "Esferas",
    description: "Colecciones de esferas en acabados mate, brillante y glitter.",
    imageUrl: "/images/categorias/esferas.webp",
    sortOrder: 2,
  },
  {
    id: "adornos",
    name: "Adornos",
    shortName: "Adornos",
    description: "Estrellas, figuras y detalles artesanales para dar carácter a tu árbol.",
    imageUrl: "/images/categorias/adornos.webp",
    sortOrder: 3,
  },
  {
    id: "luces",
    name: "Luces",
    shortName: "Luces",
    description: "Series LED de luz cálida y decorativa para interior y exterior.",
    imageUrl: "/images/categorias/luces.webp",
    sortOrder: 4,
  },
  {
    id: "coronas",
    name: "Coronas y guirnaldas",
    shortName: "Coronas",
    description: "Coronas para puerta y guirnaldas para chimeneas, escaleras y mesas.",
    imageUrl: "/images/categorias/coronas.webp",
    sortOrder: 5,
  },
];

export const DEMO_SETTINGS: StoreSettings = {
  shippingFlatCents: 19900,
  freeShippingThresholdCents: null,
  promoText: "Colección Navidad 2026",
  businessName: "NaviExpoNavidad",
  contactEmail: "",
  contactPhone: "",
  businessAddress: "",
};

type DemoProductInput = Omit<Product, "id" | "published" | "createdAt" | "variants"> & {
  createdAt?: string;
  variants?: Omit<ProductVariant, "id">[];
};

/** A tree sold in several heights: one product, one size per entry. */
function treeSizes(sizes: { heightCm: number; priceCents: number; stock: number }[]): Omit<ProductVariant, "id">[] {
  return sizes.map(({ heightCm, priceCents, stock }) => ({
    label: `${(heightCm / 100).toFixed(2)} m`,
    priceCents,
    salePriceCents: null,
    stock,
  }));
}

/** An ornament sold in several colors at the same price: one product, one color per entry. */
function colorOptions(colors: string[], priceCents: number): Omit<ProductVariant, "id">[] {
  return colors.map((label) => ({ label, priceCents, salePriceCents: null, stock: 10 }));
}

/** The 31 cm "Candy" ornament: same piece in several metallic colors, one product per color. */
function candyOrnament(slugColor: string, color: string, finish: string, shades?: string[]): DemoProductInput {
  return {
    slug: `esfera-candy-${slugColor}`,
    name: `Esfera Candy ${color}, 31 cm`,
    categoryId: "esferas",
    description: `Adorno gigante de 31 cm con forma de caramelo envuelto. El centro es un disco ${finish} de alto brillo con un remolino en blanco escarchado, y las dos puntas de la envoltura vienen en blanco nevado con glitter y chispas de colores pastel, como un dulce de verdad. Trae casquillo para colgar. Por su tamaño es ideal como pieza protagonista en el árbol, en coronas, centros de mesa o en una decoración temática de dulces.`,
    priceCents: 15000,
    salePriceCents: null,
    stock: 10,
    images: [`/images/productos/esfera-candy-${slugColor}-portada.webp`, `/images/productos/esfera-candy-${slugColor}-1.webp`],
    badge: "nuevo",
    featured: true,
    attributes: shades ? { piezas: "1", medidas: "31 cm" } : { color, piezas: "1", medidas: "31 cm" },
    variants: shades ? colorOptions(shades, 15000) : undefined,
    // Same date as Caramel Red, listed after it, so Caramel Red stays first in Esferas.
    createdAt: "2026-10-15",
  };
}

const demoProductInputs: DemoProductInput[] = [
  {
    slug: "holandes",
    name: "Holandés",
    categoryId: "arboles",
    description:
      "Pino clásico de agujas largas en dos tonos de verde: follaje verde profundo con puntas en verde brillante que le dan luz y un aspecto fresco y natural. Las ramas tienen detalles en tono café que imitan los brotes del pino. Silueta cónica tradicional, tronco recubierto de follaje para que no se vea el metal y base metálica de cuatro patas para mayor estabilidad. Es una base perfecta para decorar con esferas y luces a tu gusto.",
    priceCents: 0,
    salePriceCents: null,
    stock: 0,
    images: [
      "/images/productos/holandes-portada.webp",
      "/images/productos/holandes-1.webp",
      "/images/productos/holandes-2.webp",
    ],
    badge: "nuevo",
    featured: true,
    attributes: { forma: "Completo", luz: "Sin luz", color: "Verde" },
    variants: treeSizes([
      { heightCm: 190, priceCents: 249900, stock: 10 },
      { heightCm: 220, priceCents: 329900, stock: 10 },
      { heightCm: 250, priceCents: 399900, stock: 10 },
    ]),
    createdAt: "2026-10-14",
  },
  {
    slug: "barroco",
    name: "Barroco",
    categoryId: "arboles",
    description:
      "Árbol clásico tipo abeto en verde brillante, de aguja corta y follaje abundante, con ramas que se abren en forma de estrella para darle volumen y un look natural. Su silueta esbelta y alta, con punta definida y ramas que se ensanchan hacia la base, luce elegante sin ocupar demasiado espacio. Se sostiene sobre una base metálica en cruz. Es una base perfecta para decorar a tu gusto con luces, esferas y adornos de cualquier estilo.",
    priceCents: 0,
    salePriceCents: null,
    stock: 0,
    images: [
      "/images/productos/barroco-portada.webp",
      "/images/productos/barroco-1.webp",
      "/images/productos/barroco-2.webp",
      "/images/productos/barroco-3.webp",
    ],
    badge: "nuevo",
    featured: true,
    attributes: { forma: "Completo", luz: "Sin luz", color: "Verde" },
    variants: treeSizes([{ heightCm: 225, priceCents: 449900, stock: 10 }]),
    createdAt: "2026-10-14",
  },
  {
    slug: "alpe-europeo",
    name: "Alpe Europeo",
    categoryId: "arboles",
    description:
      "Árbol nevado de inspiración europea que combina agujas largas tipo pino con ramas de cedro cubiertas de nieve artificial, para un follaje con textura, profundidad y mucho volumen. Lleva piñas de aspecto natural repartidas en todo el árbol y se sostiene sobre una base metálica. Luce espectacular solo o con esferas doradas y plateadas.",
    priceCents: 0,
    salePriceCents: null,
    stock: 0,
    images: [
      "/images/productos/alpe-europeo-portada.webp",
      "/images/productos/alpe-europeo-1.webp",
      "/images/productos/alpe-europeo-2.webp",
      "/images/productos/alpe-europeo-3.webp",
    ],
    badge: "nuevo",
    featured: true,
    attributes: { luz: "Sin luz", color: "Verde nevado" },
    variants: treeSizes([
      { heightCm: 220, priceCents: 499900, stock: 10 },
      { heightCm: 250, priceCents: 599900, stock: 10 },
    ]),
    createdAt: "2026-10-14",
  },
  {
    slug: "candy",
    name: "Candy",
    categoryId: "arboles",
    description:
      "Árbol multicolor de follaje tupido tipo abeto que mezcla ramas en tonos pastel: verde limón, menta, lila y amarillo mantequilla, repartidos por todo el árbol para un efecto alegre y divertido, como de dulce. Silueta cónica completa con ramas amplias en la parte baja. Es ideal para una Navidad diferente y llena de color: luce increíble solo o con esferas blancas, plateadas o en tonos pastel.",
    priceCents: 0,
    salePriceCents: null,
    stock: 0,
    images: ["/images/productos/candy-portada.webp", "/images/productos/candy-tienda-1.webp"],
    badge: "nuevo",
    featured: true,
    attributes: { forma: "Completo", luz: "Sin luz", color: "Multicolor" },
    variants: treeSizes([
      { heightCm: 190, priceCents: 280000, stock: 10 },
      { heightCm: 220, priceCents: 380000, stock: 10 },
    ]),
    createdAt: "2026-10-15",
  },
  {
    slug: "moliere",
    name: "Moliere",
    categoryId: "arboles",
    description:
      "Árbol premium de follaje mixto y muy tupido que combina tres texturas: ramas de abeto de aguja corta, ramilletes de pino de aguja larga con puntas escarchadas en tono verde azulado y brotes en verde claro que imitan el crecimiento nuevo. Lleva piñas de aspecto natural repartidas por todo el árbol, que le dan un look de bosque recién cortado. Silueta cónica completa con ramas amplias en la parte baja y base metálica. Luce elegante solo o con esferas doradas, rojas o en tonos madera.",
    priceCents: 0,
    salePriceCents: null,
    stock: 0,
    images: [
      "/images/productos/moliere-portada.webp",
      "/images/productos/moliere-1.webp",
      "/images/productos/moliere-nuevo-1.webp",
      "/images/productos/moliere-nuevo-2.webp",
    ],
    badge: "nuevo",
    featured: true,
    attributes: { forma: "Completo", luz: "Sin luz", color: "Verde" },
    variants: treeSizes([
      { heightCm: 195, priceCents: 528000, stock: 10 },
      { heightCm: 250, priceCents: 748000, stock: 10 },
      { heightCm: 360, priceCents: 2280000, stock: 10 },
    ]),
    createdAt: "2026-10-15",
  },
  {
    slug: "aura",
    name: "Aura",
    categoryId: "arboles",
    description:
      "Árbol de follaje verde intenso tipo pino, de aguja fina y muy tupido, con puntas escarchadas en blanco que simulan una ligera nevada. Ya viene decorado con piñas naturales con toques de nieve y racimos de frutos rojos repartidos por todo el árbol, para un look navideño clásico de bosque invernal desde el primer momento. Silueta cónica tradicional y base metálica de cuatro patas para mayor estabilidad. Luce precioso solo o con luces de blanco cálido y esferas rojas, doradas o plateadas.",
    priceCents: 0,
    salePriceCents: null,
    stock: 0,
    images: [
      "/images/productos/aura-portada.webp",
      "/images/productos/aura-tienda-1.webp",
      "/images/productos/aura-tienda-2.webp",
      "/images/productos/aura-tienda-3.webp",
      "/images/productos/aura-3.webp",
    ],
    badge: "nuevo",
    featured: true,
    attributes: { forma: "Completo", luz: "Sin luz", color: "Verde nevado" },
    variants: treeSizes([
      { heightCm: 190, priceCents: 260000, stock: 10 },
      { heightCm: 220, priceCents: 350000, stock: 10 },
    ]),
    createdAt: "2026-10-15",
  },
  {
    slug: "baltico-rosa",
    name: "Báltico Rosa",
    categoryId: "arboles",
    description:
      "Árbol rosa pastel de follaje tipo abeto, muy esponjado y tupido, con ramas de aguja fina en un tono rosa uniforme de punta a base. Silueta cónica completa con ramas amplias en la parte baja y base metálica de cuatro patas para mayor estabilidad. Es el protagonista perfecto para una Navidad moderna, romántica o temática: luce increíble con esferas blancas, plateadas, doradas o en tonos fucsia, y con luces de blanco cálido.",
    priceCents: 0,
    salePriceCents: null,
    stock: 0,
    images: [
      "/images/productos/baltico-rosa-portada.webp",
      "/images/productos/baltico-rosa-1.webp",
      "/images/productos/baltico-rosa-2.webp",
      "/images/productos/baltico-rosa-3.webp",
    ],
    badge: "nuevo",
    featured: true,
    attributes: { forma: "Completo", luz: "Sin luz", color: "Rosa" },
    variants: treeSizes([
      { heightCm: 190, priceCents: 280000, stock: 10 },
      { heightCm: 220, priceCents: 380000, stock: 10 },
    ]),
    createdAt: "2026-10-15",
  },
  {
    slug: "verona",
    name: "Verona",
    categoryId: "arboles",
    description:
      "Árbol de pino de aguja larga en tono verde bosque con reflejos verde azulado, de follaje abundante y ramas que se abren en forma de estrella para darle un aspecto natural y frondoso. Lleva piñas naturales repartidas por todo el árbol, que le dan un look rústico de bosque recién cortado. Silueta cónica completa con ramas amplias en la parte baja. Luce precioso solo o con luces de blanco cálido y esferas doradas, rojas o en tonos madera.",
    priceCents: 0,
    salePriceCents: null,
    stock: 0,
    images: ["/images/productos/verona-portada.webp", "/images/productos/verona-1.webp", "/images/productos/verona-2.webp"],
    badge: "nuevo",
    featured: true,
    attributes: { forma: "Completo", luz: "Sin luz", color: "Verde" },
    variants: treeSizes([
      { heightCm: 190, priceCents: 460000, stock: 10 },
      { heightCm: 220, priceCents: 540000, stock: 10 },
      { heightCm: 250, priceCents: 680000, stock: 10 },
      { heightCm: 360, priceCents: 1980000, stock: 10 },
    ]),
    createdAt: "2026-10-17",
  },
  {
    slug: "esferas-caramel-red",
    name: "Esferas Caramel Red, 24 piezas",
    categoryId: "esferas",
    description:
      "Juego de 24 esferas del número 8 (8 cm) inspiradas en los clásicos bastones de caramelo: franjas en espiral que alternan rojo metálico de alto brillo con blanco escarchado con destellos de glitter. Cada esfera trae su casquillo dorado listo para colgar. Le dan a tu árbol un look navideño alegre y dulce, y combinan perfecto con árboles verdes, blancos o nevados y con esferas rojas lisas.",
    priceCents: 30000,
    salePriceCents: null,
    stock: 10,
    images: [
      "/images/productos/esferas-caramel-red-portada.webp",
      "/images/productos/esferas-caramel-red-1.webp",
      "/images/productos/esferas-caramel-red-2.webp",
      "/images/productos/esferas-caramel-red-3.webp",
    ],
    badge: "nuevo",
    featured: true,
    attributes: { color: "Rojo y blanco", piezas: "24", medidas: "8 cm" },
    createdAt: "2026-10-15",
  },
  {
    slug: "esferas-caramelo-verde-15cm",
    name: "Esferas Caramelo Verde, 15 cm, 5 piezas",
    categoryId: "esferas",
    description:
      "Juego de 5 esferas grandes de 15 cm inspiradas en los dulces de menta envueltos: base verde metálico de alto brillo con franjas curvas en blanco escarchado con destellos de glitter que se cruzan como un caramelo. Cada esfera trae su casquillo dorado listo para colgar y vienen en su caja transparente, ideal para guardarlas o regalarlas. Por su tamaño lucen como piezas protagonistas en el árbol, en coronas, guirnaldas o centros de mesa, y combinan perfecto con árboles verdes o nevados y con esferas rojas, doradas o de caramelo.",
    priceCents: 40000,
    salePriceCents: null,
    stock: 10,
    images: ["/images/productos/esferas-caramelo-verde-15cm-portada.webp"],
    badge: "nuevo",
    featured: true,
    attributes: { color: "Verde y blanco", piezas: "5", medidas: "15 cm" },
    createdAt: "2026-10-20",
  },
  {
    slug: "esferas-caramelo-rojo-15cm",
    name: "Esferas Caramelo Rojo, 15 cm, 5 piezas",
    categoryId: "esferas",
    description:
      "Juego de 5 esferas grandes de 15 cm inspiradas en los dulces de caramelo envueltos: base rojo metálico de alto brillo con franjas curvas en blanco escarchado con destellos de glitter que se cruzan como un caramelo. Cada esfera trae su casquillo dorado listo para colgar y vienen en su caja transparente, ideal para guardarlas o regalarlas. Por su tamaño lucen como piezas protagonistas en el árbol, en coronas, guirnaldas o centros de mesa, y combinan perfecto con árboles verdes, blancos o nevados y con las Esferas Caramel Red o la versión en verde de este mismo modelo.",
    priceCents: 40000,
    salePriceCents: null,
    stock: 10,
    images: ["/images/productos/esferas-caramelo-rojo-15cm-portada.webp"],
    badge: "nuevo",
    featured: true,
    attributes: { color: "Rojo y blanco", piezas: "5", medidas: "15 cm" },
    createdAt: "2026-10-20",
  },
  {
    slug: "esferas-caramelo-mix-gold-10cm",
    name: "Esferas Caramelo Mix Gold, 10 cm, 24 piezas",
    categoryId: "esferas",
    description:
      "Juego de 24 esferas de 10 cm en tres acabados que combinan entre sí: dorado espejo de alto brillo, dorado champaña con glitter y tipo caramelo con franjas en blanco escarchado sobre dorado brillante. Cada esfera trae su casquillo listo para colgar y vienen en su caja transparente para guardarlas año con año. Con un solo juego decoras el árbol completo con un look elegante y cálido en tonos dorados, ideal para árboles verdes, blancos o nevados y para combinar con luces de blanco cálido.",
    priceCents: 40000,
    salePriceCents: null,
    stock: 10,
    images: ["/images/productos/esferas-caramelo-mix-gold-10cm-portada.webp"],
    badge: "nuevo",
    featured: true,
    attributes: { color: "Dorado", piezas: "24", medidas: "10 cm" },
    createdAt: "2026-10-20",
  },
  {
    slug: "esferas-caramelo-mix-red-10cm",
    name: "Esferas Caramelo Mix Red, 10 cm, 24 piezas",
    categoryId: "esferas",
    description:
      "Juego de 24 esferas de 10 cm en tres acabados que combinan entre sí: rojo espejo de alto brillo, rojo con glitter y tipo caramelo con franjas en blanco escarchado sobre rojo brillante. Cada esfera trae su casquillo listo para colgar y vienen en su caja transparente para guardarlas año con año. Con un solo juego decoras el árbol completo con un look navideño clásico y alegre, ideal para árboles verdes, blancos o nevados y para combinar con esferas doradas o con la versión Mix Gold de este mismo modelo.",
    priceCents: 40000,
    salePriceCents: null,
    stock: 10,
    images: ["/images/productos/esferas-caramelo-mix-red-10cm-portada.webp"],
    badge: "nuevo",
    featured: true,
    attributes: { color: "Rojo", piezas: "24", medidas: "10 cm" },
    createdAt: "2026-10-20",
  },
  {
    slug: "esferas-caramelo-mix-pink-10cm",
    name: "Esferas Caramelo Mix Pink, 10 cm, 24 piezas",
    categoryId: "esferas",
    description:
      "Juego de 24 esferas de 10 cm en tres acabados que combinan entre sí: rosa espejo de alto brillo, rosa palo con glitter y tipo caramelo con franjas en blanco escarchado sobre rosa brillante. Cada esfera trae su casquillo listo para colgar y vienen en su caja transparente para guardarlas año con año. Con un solo juego decoras el árbol completo con un look dulce y moderno en tonos rosa, ideal para árboles blancos, nevados o rosas como el Báltico Rosa, y para combinar con esferas plateadas o con las versiones Mix Gold y Mix Red de este mismo modelo.",
    priceCents: 40000,
    salePriceCents: null,
    stock: 10,
    images: ["/images/productos/esferas-caramelo-mix-pink-10cm-portada.webp"],
    badge: "nuevo",
    featured: true,
    attributes: { color: "Rosa", piezas: "24", medidas: "10 cm" },
    createdAt: "2026-10-20",
  },
  {
    slug: "esferas-velvet-red-8cm",
    name: "Esferas Velvet Red, 8 cm, 9 piezas",
    categoryId: "esferas",
    description:
      "Juego de 9 esferas de 8 cm con acabado de terciopelo (velvet) en rojo intenso: una textura suave y aterciopelada al tacto, sin brillos, que da un look elegante y acogedor. Cada esfera trae su casquillo dorado listo para colgar y vienen en caja con divisiones para guardarlas sin que se maltraten. Lucen increíbles en árboles verdes, nevados o blancos, y combinan perfecto con esferas doradas, luces de blanco cálido y con la versión Velvet Green de este mismo modelo.",
    priceCents: 20000,
    salePriceCents: null,
    stock: 10,
    images: ["/images/productos/esferas-velvet-red-8cm-portada.webp"],
    badge: "nuevo",
    featured: true,
    attributes: { color: "Rojo", piezas: "9", medidas: "8 cm" },
    createdAt: "2026-10-22",
  },
  {
    slug: "esferas-velvet-green-8cm",
    name: "Esferas Velvet Green, 8 cm, 9 piezas",
    categoryId: "esferas",
    description:
      "Juego de 9 esferas de 8 cm con acabado de terciopelo (velvet) en verde esmeralda profundo: una textura suave y aterciopelada al tacto, sin brillos, que da un look elegante y acogedor. Cada esfera trae su casquillo dorado listo para colgar y vienen en caja con divisiones para guardarlas sin que se maltraten. Lucen increíbles en árboles blancos o nevados y dan profundidad en árboles verdes; combinan perfecto con esferas doradas, luces de blanco cálido y con la versión Velvet Red de este mismo modelo.",
    priceCents: 20000,
    salePriceCents: null,
    stock: 10,
    images: ["/images/productos/esferas-velvet-green-8cm-portada.webp"],
    badge: "nuevo",
    featured: true,
    attributes: { color: "Verde", piezas: "9", medidas: "8 cm" },
    createdAt: "2026-10-22",
  },
  candyOrnament("azul", "Azul", "azul metálico", ["Azul rey", "Turquesa"]),
  candyOrnament("plateado", "Plateado", "plateado espejo"),
  candyOrnament("dorado", "Dorado", "dorado metálico"),
  candyOrnament("rojo", "Rojo", "rojo metálico"),
  {
    slug: "adorno-galleta-jengibre",
    name: "Adorno Galleta de Jengibre, 4 piezas",
    categoryId: "adornos",
    description:
      "Paquete de 4 adornos en forma de galleta de jengibre, el clásico hombrecito navideño: cuerpo en dorado y caramelo metálico de alto brillo, carita sonriente, botones y moñito en rojo con glitter, y un gorro de Santa en rojo escarchado con borde blanco. Cada uno trae su casquillo dorado listo para colgar. Le dan a tu árbol un toque divertido y tierno, perfecto para una decoración temática de dulces junto al Adorno Pretzel, la Dona y las esferas de caramelo.",
    priceCents: 10000,
    salePriceCents: null,
    stock: 10,
    images: ["/images/productos/adorno-galleta-jengibre-portada.webp"],
    badge: "nuevo",
    featured: true,
    attributes: { color: "Dorado", piezas: "4" },
    createdAt: "2026-10-22",
  },
  {
    slug: "adorno-pretzel",
    name: "Adorno Pretzel",
    categoryId: "adornos",
    description:
      "Divertido adorno en forma de pretzel con acabado café chocolate cubierto de glitter brillante y chispas de colores pastel en rosa, azul, lila y amarillo, como un pretzel bañado en chocolate. Trae hilo plateado para colgarlo fácilmente de las ramas. Es ideal para darle un toque dulce y original a tu árbol, y combina perfecto con una decoración temática de dulces junto a las esferas Candy y Caramel Red.",
    priceCents: 5000,
    salePriceCents: null,
    stock: 10,
    images: [
      "/images/productos/adorno-pretzel-portada.webp",
      "/images/productos/adorno-pretzel-1.webp",
      "/images/productos/adorno-pretzel-2.webp",
    ],
    badge: "nuevo",
    featured: true,
    attributes: { color: "Café chocolate", piezas: "1" },
    createdAt: "2026-10-16",
  },
  {
    slug: "adorno-coffee",
    name: "Adorno Coffee",
    categoryId: "adornos",
    description:
      "Adorno en forma de vaso de café para llevar, con cuerpo metalizado de alto brillo y tapa blanca escarchada con glitter. Lleva un sello circular con un copo de nieve al frente y pequeños copos, pinitos y puntos blancos alrededor, con una franja escarchada en la base. Trae casquillo plateado y cordón para colgar. Perfecto para los amantes del café y para una decoración navideña divertida y moderna; luce increíble entre ramas verdes o nevadas.",
    priceCents: 5000,
    salePriceCents: null,
    stock: 10,
    images: [
      "/images/productos/adorno-coffee-portada.webp",
      "/images/productos/adorno-coffee-1.webp",
    ],
    badge: "nuevo",
    featured: true,
    attributes: { piezas: "1" },
    variants: colorOptions(["Azul", "Rojo"], 5000),
    createdAt: "2026-10-16",
  },
  {
    slug: "adorno-cono-helado",
    name: "Adorno Cono de Helado",
    categoryId: "adornos",
    description:
      "Adorno en forma de cono de helado con remolino de nieve en blanco escarchado con glitter y chispas de colores pastel. El cono tiene acabado metalizado de alto brillo con relieve de galleta waffle, y el remolino se alterna con franjas del mismo color brillante. Trae casquillo dorado y cordón para colgar. Le da a tu árbol un toque dulce y alegre, y combina perfecto con los adornos Pretzel y Coffee y con las esferas Candy.",
    priceCents: 5000,
    salePriceCents: null,
    stock: 10,
    images: [
      "/images/productos/adorno-cono-helado-portada.webp",
      "/images/productos/adorno-cono-helado-1.webp",
    ],
    badge: "nuevo",
    featured: true,
    attributes: { piezas: "1" },
    variants: colorOptions(["Dorado", "Rojo"], 5000),
    createdAt: "2026-10-16",
  },
  {
    slug: "adorno-paleta-dulce",
    name: "Adorno Paleta de Dulce",
    categoryId: "adornos",
    description:
      "Adorno en forma de paleta de caramelo con un remolino en espiral que alterna franjas blancas escarchadas con franjas metalizadas con textura de glitter, como una paleta artesanal. El palito tiene acabado metálico brillante del mismo tono. Trae casquillo plateado y cordón para colgar. Le da a tu árbol un toque dulce y juguetón, y combina perfecto con los adornos Pretzel, Coffee y Cono de Helado y con las esferas Candy.",
    priceCents: 5000,
    salePriceCents: null,
    stock: 10,
    images: [
      "/images/productos/adorno-paleta-dulce-portada.webp",
      "/images/productos/adorno-paleta-dulce-1.webp",
      "/images/productos/adorno-paleta-dulce-2.webp",
    ],
    badge: "nuevo",
    featured: true,
    attributes: { piezas: "1" },
    variants: colorOptions(["Rosa", "Turquesa"], 5000),
    createdAt: "2026-10-16",
  },
  {
    slug: "adorno-dona",
    name: "Adorno Dona",
    categoryId: "adornos",
    description:
      "Adorno en forma de dona glaseada con cobertura blanca escarchada con glitter y chispas de colores pastel en rosa, azul, lila, verde menta y amarillo, como recién salida de la panadería. Trae casquillo dorado y cordón para colgar. Le da a tu árbol un toque dulce y divertido, y combina perfecto con los adornos Pretzel, Coffee, Cono de Helado y Paleta de Dulce y con las esferas Candy.",
    priceCents: 5000,
    salePriceCents: null,
    stock: 10,
    images: ["/images/productos/adorno-dona-portada.webp", "/images/productos/adorno-dona-1.webp"],
    badge: "nuevo",
    featured: true,
    attributes: { color: "Blanco", piezas: "1" },
    createdAt: "2026-10-16",
  },
  {
    slug: "adorno-caballito",
    name: "Adorno Caballito",
    categoryId: "adornos",
    description:
      "Adorno clásico en forma de caballito mecedor con acabado metalizado de alto brillo, montura dorada con detalles en verde, riendas doradas y crin con relieve. La base mecedora viene cubierta de glitter dorado y entre las patas lleva un pequeño pino verde con regalos dorados. Trae casquillo y cordón para colgar. Un adorno tradicional y nostálgico que le da a tu árbol un toque de juguetería navideña antigua.",
    priceCents: 5000,
    salePriceCents: null,
    stock: 10,
    images: ["/images/productos/adorno-caballito-portada.webp", "/images/productos/adorno-caballito-1.webp"],
    badge: "nuevo",
    featured: true,
    attributes: { piezas: "1" },
    variants: colorOptions(["Rojo", "Turquesa"], 5000),
    createdAt: "2026-10-16",
  },
];

export const DEMO_PRODUCTS: Product[] = demoProductInputs.map((product) =>
  withVariantSummary({
    ...product,
    id: product.slug,
    published: true,
    variants: (product.variants ?? []).map((variant, index) => ({ ...variant, id: `${product.slug}-${index + 1}` })),
    createdAt: product.createdAt ?? "2026-10-01",
  }),
);
