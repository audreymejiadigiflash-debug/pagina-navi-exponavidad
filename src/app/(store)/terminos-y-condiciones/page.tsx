import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { getStoreSettings } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Condiciones de compra en la tienda en línea.",
  alternates: { canonical: "/terminos-y-condiciones" },
};

export default async function TermsPage() {
  const settings = await getStoreSettings();
  return (
    <LegalPage title="Términos y condiciones" updated="octubre de 2026">
      <p>
        Al comprar en este sitio aceptas las siguientes condiciones de venta de {settings.businessName}. Te
        recomendamos leerlas antes de realizar tu pedido.
      </p>
      <h2>Precios</h2>
      <p>
        Todos los precios están expresados en pesos mexicanos (MXN) e incluyen IVA. El costo de envío se muestra antes
        de pagar. Los precios y promociones pueden cambiar sin previo aviso, pero respetaremos el precio vigente al
        momento de tu compra.
      </p>
      <h2>Pedidos y pagos</h2>
      <p>
        Los pagos se procesan a través de Mercado Pago. Tu pedido se confirma cuando Mercado Pago aprueba el pago. Si
        un producto se agota antes de que se confirme tu pago, te contactaremos para ofrecerte una alternativa o el
        reembolso total.
      </p>
      <h2>Envíos y devoluciones</h2>
      <p>
        Consulta las condiciones de entrega, devoluciones y garantías en nuestra página de{" "}
        <Link href="/envios-y-devoluciones">envíos y devoluciones</Link>.
      </p>
      <h2>Fotografías</h2>
      <p>
        Procuramos que las fotografías representen fielmente cada producto; los colores pueden variar ligeramente
        según la pantalla.
      </p>
      <h2>Contacto y aclaraciones</h2>
      <p>
        Para cualquier duda o aclaración escríbenos
        {settings.contactEmail ? ` a ${settings.contactEmail}` : " por los medios publicados en este sitio"}. También
        puedes acudir a la Procuraduría Federal del Consumidor (PROFECO).
      </p>
    </LegalPage>
  );
}
