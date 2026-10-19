import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost, Montserrat } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

// Brand wordmark only (logo); the rest of the site keeps Cormorant and Jost.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["500", "800"],
  display: "swap",
});

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NaviExpoNavidad | Árboles de Navidad, esferas y decoración navideña",
    template: "%s | NaviExpoNavidad",
  },
  description:
    "Árboles de Navidad, esferas, luces, adornos y coronas seleccionados para tu hogar. Compra en línea con pago seguro y envío a todo México.",
  openGraph: {
    type: "website",
    siteName: "NaviExpoNavidad",
    locale: "es_MX",
    images: [{ url: "/images/og.jpg", width: 1200, height: 630, alt: "NaviExpoNavidad" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#13261e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className={`${cormorant.variable} ${jost.variable} ${montserrat.variable}`}>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
