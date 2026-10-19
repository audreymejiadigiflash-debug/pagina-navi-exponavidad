import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getCategories, getPublishedProducts, getStoreSettings } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { buildNavigation } from "@/lib/navigation";
import { currentYear } from "@/lib/time";
import type { StoreSettings } from "@/lib/types";

function announcementFor(settings: StoreSettings): string {
  const shipping =
    settings.freeShippingThresholdCents !== null
      ? `Envío gratis en compras desde ${formatPrice(settings.freeShippingThresholdCents)}`
      : "Envíos a todo México";
  return [settings.promoText, shipping].filter(Boolean).join("  ·  ");
}

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [categories, products, settings, year] = await Promise.all([
    getCategories(),
    getPublishedProducts(),
    getStoreSettings(),
    currentYear(),
  ]);
  const navigation = buildNavigation(categories, products);

  return (
    <>
      <SiteHeader navigation={navigation} announcement={announcementFor(settings)} />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <SiteFooter navigation={navigation} settings={settings} year={year} />
    </>
  );
}
