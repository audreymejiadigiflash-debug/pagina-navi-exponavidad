import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShieldIcon, TruckIcon } from "@/components/icons";
import { ProductBadges } from "@/components/product/product-badges";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";
import { getCategories, getProductBySlug, getPublishedProducts, getStoreSettings } from "@/lib/catalog";
import { ATTRIBUTE_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { categoryHref } from "@/lib/navigation";
import { effectivePriceCents, isInStock } from "@/lib/pricing";
import { ATTRIBUTE_KEYS } from "@/lib/types";
import { variantKindName } from "@/lib/variants";
const RELATED_LIMIT = 4;

export async function generateMetadata({ params }: PageProps<"/producto/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };
  const description = (product.description || product.name).slice(0, 155);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/producto/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      images: product.images[0] ? [{ url: product.images[0] }] : undefined,
    },
  };
}

async function ProductDetails({ params }: Pick<PageProps<"/producto/[slug]">, "params">) {
  const { slug } = await params;
  const [product, categories, products, settings] = await Promise.all([
    getProductBySlug(slug),
    getCategories(),
    getPublishedProducts(),
    getStoreSettings(),
  ]);
  if (!product) notFound();

  const category = categories.find((item) => item.id === product.categoryId);
  const categoryById = new Map(categories.map((item) => [item.id, item]));
  const inStock = isInStock(product);
  const variantLabels = product.variants.map((variant) => variant.label);
  const variantKind = variantKindName(variantLabels);
  const specs: { label: string; value: string }[] = [
    ...(variantLabels.length
      ? [
          {
            label: variantLabels.length > 1 ? `${variantKind === "Color" ? "Colores" : "Medidas"} disponibles` : variantKind,
            value: variantLabels.join(", "),
          },
        ]
      : []),
    ...ATTRIBUTE_KEYS.filter((key) => product.attributes[key]).map((key) => ({
      label: ATTRIBUTE_LABELS[key],
      value: product.attributes[key] as string,
    })),
  ];
  const variantPrices = product.variants.map((variant) => effectivePriceCents(variant));
  const related = products
    .filter((item) => item.id !== product.id && isInStock(item))
    .sort(
      (a, b) =>
        Number(b.categoryId === product.categoryId) - Number(a.categoryId === product.categoryId) ||
        Number(b.featured) - Number(a.featured),
    )
    .slice(0, RELATED_LIMIT);

  const shippingText =
    settings.freeShippingThresholdCents !== null
      ? `Envío ${settings.shippingFlatCents ? formatPrice(settings.shippingFlatCents) : "gratis"} · Gratis en compras desde ${formatPrice(settings.freeShippingThresholdCents)}`
      : settings.shippingFlatCents
        ? `Envío a todo México por ${formatPrice(settings.shippingFlatCents)}`
        : "Envío gratis a todo México";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.slug,
    offers: variantPrices.length
      ? {
          "@type": "AggregateOffer",
          priceCurrency: "MXN",
          lowPrice: (Math.min(...variantPrices) / 100).toFixed(2),
          highPrice: (Math.max(...variantPrices) / 100).toFixed(2),
          offerCount: variantPrices.length,
          availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        }
      : {
          "@type": "Offer",
          priceCurrency: "MXN",
          price: (effectivePriceCents(product) / 100).toFixed(2),
          availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify output is safe here once "<" is escaped, so user text cannot close the tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <div className="container-page pt-8">
        <nav aria-label="Ruta de navegación">
          <ol className="label-caps flex flex-wrap gap-2 text-[0.6875rem] text-ink-soft">
            <li>
              <Link href="/" className="hover:text-ink">
                Inicio
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            {category ? (
              <>
                <li>
                  <Link href={categoryHref(category.id)} className="hover:text-ink">
                    {category.shortName}
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
              </>
            ) : null}
            <li aria-current="page" className="text-ink">
              {product.name}
            </li>
          </ol>
        </nav>
      </div>

      <div className="container-page grid gap-10 py-8 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-12">
        <div className="relative">
          <ProductBadges product={product} />
          {/* The first photo is the card cover; the product page shows the rest. */}
          <ProductGallery
            images={product.images.length > 1 ? product.images.slice(1) : product.images}
            name={product.name}
          />
        </div>

        <div className="lg:sticky lg:top-[200px] lg:self-start">
          {category ? <p className="eyebrow">{category.name}</p> : null}
          <h1 className="mt-3 text-[2.4rem] md:text-[3rem]">{product.name}</h1>
          <ProductPurchase
            product={product}
            description={
              product.description ? (
                <p className="mt-6 text-[1.02rem] leading-relaxed text-ink-soft">{product.description}</p>
              ) : null
            }
          />

          <ul className="mt-8 space-y-3 border-y border-line py-6 text-[0.9rem] text-ink-soft">
            <li className="flex items-center gap-3">
              <TruckIcon size={20} className="shrink-0 text-gold-ink" />
              {shippingText}
            </li>
            <li className="flex items-center gap-3">
              <ShieldIcon size={20} className="shrink-0 text-gold-ink" />
              Pago seguro con Mercado Pago: tarjeta, OXXO o transferencia
            </li>
          </ul>

          {specs.length ? (
            <details className="group border-b border-line" open>
              <summary className="label-caps flex min-h-14 cursor-pointer list-none items-center justify-between text-[0.75rem]">
                Características
                <span className="text-lg transition-transform group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <dl className="pb-6">
                {specs.map((spec) => (
                  <div key={spec.label} className="grid grid-cols-[140px_1fr] gap-4 py-2 text-[0.9rem]">
                    <dt className="text-ink-soft">{spec.label}</dt>
                    <dd className="text-ink">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </details>
          ) : null}
          <details className="group border-b border-line">
            <summary className="label-caps flex min-h-14 cursor-pointer list-none items-center justify-between text-[0.75rem]">
              Envíos y devoluciones
              <span className="text-lg transition-transform group-open:rotate-45" aria-hidden="true">
                +
              </span>
            </summary>
            <p className="pb-6 text-[0.9rem] text-ink-soft">
              Enviamos a todo México.{" "}
              <Link href="/envios-y-devoluciones" className="link-underline text-ink">
                Consulta tiempos de entrega y devoluciones
              </Link>
              .
            </p>
          </details>
        </div>
      </div>

      {related.length ? (
        <section aria-labelledby="related-title" className="border-t border-line bg-ivory py-16 md:py-24">
          <div className="container-page">
            <div className="mb-10 text-center">
              <span className="eyebrow">Combínalo con</span>
              <h2 id="related-title" className="mt-3 text-[2.25rem] md:text-[2.75rem]">
                También te puede gustar
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 lg:gap-x-6">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} category={categoryById.get(item.categoryId)} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

function ProductSkeleton() {
  return (
    <div className="container-page grid gap-10 py-16 lg:grid-cols-[1.15fr_1fr]" aria-busy="true" aria-label="Cargando producto">
      <div className="aspect-[4/5] animate-pulse bg-ivory" />
      <div className="space-y-4">
        <div className="h-3 w-24 animate-pulse bg-ivory" />
        <div className="h-12 w-3/4 animate-pulse bg-ivory" />
        <div className="h-8 w-32 animate-pulse bg-ivory" />
        <div className="h-24 animate-pulse bg-ivory" />
        <div className="h-12 animate-pulse bg-ivory" />
      </div>
    </div>
  );
}

export default function ProductPage({ params }: PageProps<"/producto/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductDetails params={params} />
    </Suspense>
  );
}
