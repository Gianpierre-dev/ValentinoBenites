import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const fuenteSans = Inter({
  variable: "--fuente-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fabiola.pe"),
  title: {
    default: "Fabiola | Moda y accesorios para mujer",
    template: "%s | Fabiola",
  },
  description:
    "Tienda de moda y accesorios para mujer. Carteras, calzado y mas, con estilo y calidad.",
  openGraph: {
    title: "Fabiola",
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
    <html lang="es" className={`${fuenteSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-fondo text-texto">{children}</body>
    </html>
  );
}
