import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { getStoreSettings } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Aviso de privacidad",
  description: "Cómo tratamos y protegemos tus datos personales.",
  alternates: { canonical: "/aviso-de-privacidad" },
};

export default async function PrivacyPage() {
  const settings = await getStoreSettings();
  const contact = settings.contactEmail || "el correo de contacto publicado en este sitio";
  return (
    <LegalPage title="Aviso de privacidad" updated="octubre de 2026">
      <p>
        {settings.businessName}
        {settings.businessAddress ? `, con domicilio en ${settings.businessAddress},` : ""} es responsable del
        tratamiento de los datos personales que nos proporcionas, conforme a la Ley Federal de Protección de Datos
        Personales en Posesión de los Particulares.
      </p>
      <h2>Datos que recabamos</h2>
      <p>
        Para procesar tu compra solicitamos: nombre, correo electrónico, teléfono y dirección de entrega. No
        recabamos datos personales sensibles. Los datos de tu tarjeta o método de pago los captura directamente
        Mercado Pago; nosotros no los recibimos ni los almacenamos.
      </p>
      <h2>Finalidades</h2>
      <ul>
        <li>Procesar, cobrar y entregar tu pedido.</li>
        <li>Contactarte sobre el estado de tu compra, la entrega o aclaraciones.</li>
        <li>Cumplir obligaciones fiscales y legales.</li>
      </ul>
      <h2>Transferencias</h2>
      <p>
        Compartimos los datos estrictamente necesarios con Mercado Pago (procesamiento del pago) y con la empresa de
        paquetería que entregue tu pedido. No vendemos ni rentamos tus datos.
      </p>
      <h2>Derechos ARCO</h2>
      <p>
        Puedes solicitar el acceso, rectificación, cancelación u oposición al tratamiento de tus datos, así como
        revocar tu consentimiento, escribiendo a {contact}. Responderemos en un plazo máximo de 20 días hábiles.
      </p>
      <h2>Cookies y almacenamiento local</h2>
      <p>
        Usamos el almacenamiento de tu navegador únicamente para recordar los productos de tu carrito. No usamos
        cookies publicitarias.
      </p>
      <h2>Cambios a este aviso</h2>
      <p>Cualquier cambio a este aviso de privacidad se publicará en esta misma página.</p>
    </LegalPage>
  );
}
