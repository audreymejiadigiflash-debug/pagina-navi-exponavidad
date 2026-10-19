import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { getStoreSettings } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Envíos y devoluciones",
  description: "Costos de envío, entrega y política de devoluciones.",
  alternates: { canonical: "/envios-y-devoluciones" },
};

export default async function ShippingPage() {
  const settings = await getStoreSettings();
  const contact = settings.contactEmail ? `a ${settings.contactEmail}` : "por los medios publicados en este sitio";
  return (
    <LegalPage title="Envíos y devoluciones" updated="octubre de 2026">
      <h2>Costo de envío</h2>
      <p>
        {settings.shippingFlatCents > 0
          ? `Enviamos a todo México con una tarifa fija de ${formatPrice(settings.shippingFlatCents)} por pedido.`
          : "El envío a todo México no tiene costo."}
        {settings.freeShippingThresholdCents !== null
          ? ` En compras desde ${formatPrice(settings.freeShippingThresholdCents)} el envío es gratis.`
          : ""}
      </p>
      <h2>Entrega</h2>
      <p>
        Preparamos tu pedido una vez confirmado el pago y te compartimos la guía de rastreo cuando sale de nuestro
        almacén. El tiempo de entrega depende de tu localidad y de la paquetería.
      </p>
      <h2>Devoluciones</h2>
      <p>
        De acuerdo con la Ley Federal de Protección al Consumidor, en compras a distancia puedes revocar tu compra
        dentro de los 5 días hábiles siguientes a la entrega del producto. Para hacerlo, escríbenos {contact} con tu
        número de pedido. El producto debe estar sin uso y en su empaque original.
      </p>
      <h2>Productos dañados</h2>
      <p>
        Si tu pedido llega dañado o incompleto, avísanos {contact} lo antes posible, con fotografías del
        empaque y del producto, para darle solución.
      </p>
      <h2>Reembolsos</h2>
      <p>
        Los reembolsos se realizan a través de Mercado Pago, al mismo método con el que pagaste, una vez que recibimos
        y revisamos el producto devuelto.
      </p>
    </LegalPage>
  );
}
