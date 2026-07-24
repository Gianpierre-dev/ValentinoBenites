import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { NOMBRE_SITIO, URL_SITIO } from "@/lib/sitio";
import "./globals.css";

// Inter: cuerpo y UI. Fraunces: serif display para titulares grandes (h1/h2).
const fuenteSans = Inter({
  variable: "--fuente-sans",
  subsets: ["latin"],
  display: "swap",
});

// Fraunces es variable: con `axes` no se puede fijar `weight` (debe ser
// variable). Se carga el rango completo y los pesos se aplican via CSS.
const fuenteDisplay = Fraunces({
  variable: "--fuente-display",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITIO),
  title: {
    default: `${NOMBRE_SITIO} | Carteras y accesorios artesanales para mujer`,
    template: `%s | ${NOMBRE_SITIO}`,
  },
  description:
    "Carteras, bandoleras y accesorios artesanales de cuero para mujer, hechos a pedido en el Perú. Elige tu modelo y color; lo confeccionamos para ti en 24 horas.",
  alternates: { canonical: "/" },
  openGraph: {
    title: NOMBRE_SITIO,
    description:
      "Carteras y accesorios artesanales para mujer, hechos a pedido en el Perú.",
    type: "website",
    locale: "es_PE",
    siteName: NOMBRE_SITIO,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-PE"
      className={`${fuenteSans.variable} ${fuenteDisplay.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-fondo text-texto">
        <script
          type="application/ld+json"
          // Contenido estatico propio; se escapa "<" por higiene (JSON-LD).
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "OnlineStore",
              name: NOMBRE_SITIO,
              url: URL_SITIO,
              logo: `${URL_SITIO}/logo-valentino.png`,
              description:
                "Carteras y accesorios artesanales para mujer, hechos a pedido en el Perú.",
            }).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
