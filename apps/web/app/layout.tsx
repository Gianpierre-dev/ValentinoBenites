import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

// Inter: cuerpo y UI. Fraunces: serif display para titulares grandes (h1/h2).
const fuenteSans = Inter({
  variable: "--fuente-sans",
  subsets: ["latin"],
  display: "swap",
});

const fuenteDisplay = Fraunces({
  variable: "--fuente-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800", "900"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://esvalentinobenites.com"),
  title: {
    default: "Valentino Benites | Moda y accesorios para mujer",
    template: "%s | Valentino Benites",
  },
  description:
    "Tienda de moda y accesorios para mujer. Carteras, calzado y mas, con estilo y calidad.",
  openGraph: {
    title: "Valentino Benites",
    description: "Moda y accesorios para mujer.",
    type: "website",
    locale: "es_PE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${fuenteSans.variable} ${fuenteDisplay.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-fondo text-texto">{children}</body>
    </html>
  );
}
