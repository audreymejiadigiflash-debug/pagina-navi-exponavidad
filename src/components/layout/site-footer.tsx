import Link from "next/link";
import type { NavCategory } from "@/lib/navigation";
import type { StoreSettings } from "@/lib/types";
import { Logo } from "./logo";

type SiteFooterProps = {
  navigation: NavCategory[];
  settings: StoreSettings;
  year: number;
};

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="label-caps mb-5 font-sans text-[0.6875rem] font-medium text-white">{title}</h2>
      <ul className="space-y-3 text-[0.9rem] text-white/70">{children}</ul>
    </div>
  );
}

export function SiteFooter({ navigation, settings, year }: SiteFooterProps) {
  return (
    <footer className="bg-fir-deep text-white">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <Logo tone="light" />
          <p className="mt-6 text-[0.9rem] leading-relaxed text-white/70">
            Árboles, esferas, luces y adornos seleccionados para vestir tu hogar en Navidad.
          </p>
        </div>
        <FooterColumn title="Tienda">
          {navigation.map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="hover:text-white">
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/tienda?oferta=1" className="hover:text-white">
              Ofertas
            </Link>
          </li>
        </FooterColumn>
        <FooterColumn title="Ayuda">
          <li>
            <Link href="/envios-y-devoluciones" className="hover:text-white">
              Envíos y devoluciones
            </Link>
          </li>
          <li>
            <Link href="/terminos-y-condiciones" className="hover:text-white">
              Términos y condiciones
            </Link>
          </li>
          <li>
            <Link href="/aviso-de-privacidad" className="hover:text-white">
              Aviso de privacidad
            </Link>
          </li>
        </FooterColumn>
        <FooterColumn title="Contacto">
          {settings.contactEmail ? (
            <li>
              <a href={`mailto:${settings.contactEmail}`} className="hover:text-white">
                {settings.contactEmail}
              </a>
            </li>
          ) : null}
          {settings.contactPhone ? (
            <li>
              <a href={`tel:${settings.contactPhone.replace(/[^\d+]/g, "")}`} className="hover:text-white">
                {settings.contactPhone}
              </a>
            </li>
          ) : null}
          {settings.businessAddress ? <li>{settings.businessAddress}</li> : null}
          <li>Pagos seguros con Mercado Pago</li>
        </FooterColumn>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-[0.8125rem] text-white/60 md:flex-row md:justify-between">
          <p>
            © {year} {settings.businessName}. Todos los derechos reservados.
          </p>
          <p>Precios en pesos mexicanos (MXN), IVA incluido.</p>
        </div>
      </div>
    </footer>
  );
}
