import Image from "next/image";
import Link from "next/link";
import { HeroCarousel, type HeroSlide } from "@/components/home/hero-carousel";
import { SectionHeading } from "@/components/home/section-heading";
import { CardIcon, ShieldIcon, SparkleIcon, TruckIcon } from "@/components/icons";
import { ProductCard } from "@/components/product/product-card";
import { getCategories, getPublishedProducts } from "@/lib/catalog";
import { categoryHref } from "@/lib/navigation";
import { isInStock, isOnSale } from "@/lib/pricing";

const FEATURED_LIMIT = 8;

const TRUST_ITEMS = [
  { icon: ShieldIcon, title: "Pago 100% seguro", text: "Procesado por Mercado Pago" },
  { icon: CardIcon, title: "Tarjeta, OXXO o transferencia", text: "Elige cómo pagar al finalizar" },
  { icon: TruckIcon, title: "Envíos a todo México", text: "Seguimiento de tu pedido" },
  { icon: SparkleIcon, title: "Selección de temporada", text: "Piezas elegidas una a una" },
];

const TREE_FINDER = [
  { ceiling: "2.20 m", tree: "1.80 m", note: "Departamentos y recibidores" },
  { ceiling: "2.40 m", tree: "2.10 m", note: "La altura más elegida" },
  { ceiling: "2.70 m", tree: "2.40 m", note: "Salas amplias" },
  { ceiling: "3.00 m o más", tree: "2.70 m o más", note: "Dobles alturas" },
];

const heroSlides: HeroSlide[] = [
  {
    id: "temporada",
    image: "/images/hero.webp",
    imagePosition: "object-[70%_center]",
    eyebrow: "Colección Navidad 2026",
    title: "El arte de vestir tu hogar en Navidad",
    text: "Árboles de follaje realista, esferas y adornos elegidos para crear una Navidad que se recuerda.",
    primary: { href: categoryHref("arboles"), label: "Descubrir árboles" },
    secondary: { href: "/tienda", label: "Ver la colección" },
  },
  {
    id: "dulces",
    image: "/images/hero/slide-dulces.webp",
    imagePosition: "object-[72%_center] md:object-center",
    eyebrow: "Navidad dulce",
    title: "Adornos que parecen golosinas",
    text: "Caramelos, pretzels, donas y paletas con glitter y chispas de colores para un árbol divertido.",
    primary: { href: categoryHref("adornos"), label: "Ver adornos" },
  },
  {
    id: "nevados",
    image: "/images/hero/slide-nevados.webp",
    imagePosition: "object-[70%_center] md:object-center",
    eyebrow: "Árboles nevados",
    title: "Un bosque de invierno en tu sala",
    text: "Puntas escarchadas, piñas y frutos rojos para una Navidad blanca, clásica y acogedora.",
    primary: { href: categoryHref("arboles"), label: "Ver árboles" },
  },
  {
    id: "esferas",
    image: "/images/hero/slide-esferas.webp",
    imagePosition: "object-[75%_center] md:object-center",
    eyebrow: "Esferas",
    title: "Brillo en dorado, plata y rosa",
    text: "Glitter, espejo, escamas y franjas escarchadas para combinar a tu gusto.",
    primary: { href: categoryHref("esferas"), label: "Ver esferas" },
  },
  {
    id: "clasicas",
    image: "/images/hero/slide-clasicas.webp",
    imagePosition: "object-[75%_center] md:object-center",
    eyebrow: "Clásicos de siempre",
    title: "Esferas que nunca pasan de moda",
    text: "Rojo, dorado y plateado de alto brillo: la base de todo árbol elegante.",
    primary: { href: categoryHref("esferas"), label: "Ver esferas" },
  },
  {
    id: "inflables",
    image: "/images/hero/slide-inflables.webp",
    imagePosition: "object-[72%_center] md:object-center",
    eyebrow: "Muy pronto",
    title: "Inflables gigantes para tu jardín",
    text: "Muñecos de nieve y Santas que reciben a todos con alegría. Llegan pronto a la tienda.",
  },
  {
    id: "guia",
    image: "/images/hero/slide-guia.webp",
    imagePosition: "object-[78%_center] md:object-center",
    eyebrow: "Guía de alturas",
    title: "¿Qué altura de árbol necesitas?",
    text: "Desde espacios pequeños hasta grandes escenarios: tenemos un árbol para cada Navidad.",
    primary: { href: "#guia-alturas", label: "Ver la guía" },
  },
];

export default async function HomePage() {
  const [categories, products] = await Promise.all([getCategories(), getPublishedProducts()]);
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const available = products.filter(isInStock);
  const featured = (available.some((product) => product.featured)
    ? available.filter((product) => product.featured)
    : available
  ).slice(0, FEATURED_LIMIT);
  const onSale = available.filter(isOnSale).slice(0, 4);

  return (
    <>
      <HeroCarousel slides={heroSlides} />

      {/* Trust strip */}
      <section aria-label="Compra con confianza" className="border-b border-line bg-ivory">
        <ul className="container-page grid grid-cols-2 gap-x-6 gap-y-8 py-10 lg:grid-cols-4">
          {TRUST_ITEMS.map(({ icon: ItemIcon, title, text }) => (
            <li key={title} className="flex flex-col items-center gap-2 text-center lg:flex-row lg:text-left">
              <ItemIcon size={28} className="shrink-0 text-gold-ink" />
              <span>
                <span className="block text-[0.9rem] font-medium text-ink">{title}</span>
                <span className="block text-[0.8125rem] text-ink-soft">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Categories */}
      <section aria-labelledby="categories-title" className="container-page py-20 md:py-28">
        <SectionHeading id="categories-title" eyebrow="Colecciones" title="Compra por categoría" />
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-5 lg:gap-x-6">
          {categories.map((category) => (
            <li key={category.id}>
              <Link href={categoryHref(category.id)} className="group block no-underline">
                <span className="relative block aspect-[3/4] overflow-hidden bg-ivory">
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  ) : null}
                </span>
                <span className="mt-4 block text-center font-serif text-[1.5rem] leading-tight text-ink">
                  {category.name}
                </span>
                <span className="label-caps mt-1 block text-center text-[0.6875rem] text-ink-soft group-hover:text-ink">
                  Ver colección
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Featured */}
      {featured.length ? (
        <section aria-labelledby="featured-title" className="bg-ivory py-20 md:py-28">
          <div className="container-page">
            <SectionHeading
              id="featured-title"
              eyebrow="Favoritos de la temporada"
              title="Lo más elegido"
              link={{ href: "/tienda", label: "Ver toda la tienda" }}
            />
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
              {featured.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  category={categoryById.get(product.categoryId)}
                  priority={index < 2}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Editorial: tree finder */}
      <section id="guia-alturas" aria-labelledby="finder-title" className="grid scroll-mt-[200px] lg:grid-cols-2">
        <div className="relative min-h-[420px] lg:min-h-[640px]">
          <Image
            src="/images/editorial-arbol.webp"
            alt="Sala luminosa con un árbol de Navidad decorado junto a la ventana"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex items-center bg-linen px-6 py-16 md:px-16 lg:px-20">
          <div className="w-full max-w-lg">
            <span className="eyebrow">Guía de alturas</span>
            <h2 id="finder-title" className="mt-4 text-[2.25rem] md:text-[3rem]">
              Encuentra el árbol perfecto
            </h2>
            <p className="mt-4 text-ink-soft">
              Mide de piso a techo y deja entre 20 y 30 cm libres para la estrella. Elige la altura de tu techo:
            </p>
            <ul className="mt-8 border-t border-line-strong">
              {TREE_FINDER.map((row) => (
                <li key={row.ceiling} className="border-b border-line-strong">
                  <Link
                    href={
                      row.tree.endsWith("más")
                        ? categoryHref("arboles")
                        : categoryHref("arboles", { altura: row.tree })
                    }
                    className="group flex items-center justify-between gap-4 py-5 no-underline"
                  >
                    <span>
                      <span className="label-caps block text-[0.6875rem] text-ink-soft">Techo de {row.ceiling}</span>
                      <span className="mt-1 block font-serif text-[1.6rem] leading-tight text-ink">
                        Árbol de {row.tree}
                      </span>
                      <span className="block text-[0.8125rem] text-ink-soft">{row.note}</span>
                    </span>
                    <span
                      className="text-xl text-ink transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Sale */}
      {onSale.length ? (
        <section aria-labelledby="sale-title" className="container-page py-20 md:py-28">
          <SectionHeading
            id="sale-title"
            eyebrow="Precios especiales"
            title="Ofertas de temporada"
            link={{ href: "/tienda?oferta=1", label: "Ver todas las ofertas" }}
          />
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
            {onSale.map((product) => (
              <ProductCard key={product.id} product={product} category={categoryById.get(product.categoryId)} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Banner */}
      <section aria-labelledby="banner-title" className="relative isolate overflow-hidden">
        <Image src="/images/banner-luces.webp" alt="" fill sizes="100vw" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-black/55" aria-hidden="true" />
        <div className="container-page flex min-h-[460px] flex-col items-center justify-center py-20 text-center text-white">
          <span className="eyebrow text-[#e3cc9b]">Iluminación</span>
          <h2 id="banner-title" className="mt-4 max-w-2xl text-[2.5rem] text-white md:text-[3.5rem]">
            Luz cálida que transforma cada rincón
          </h2>
          <p className="mt-4 max-w-lg text-white/85">
            Series LED de bajo consumo para árboles, guirnaldas, ventanas y mesas.
          </p>
          <Link href={categoryHref("luces")} className="btn btn-light mt-10">
            Explorar luces
          </Link>
        </div>
      </section>
    </>
  );
}
