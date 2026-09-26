import type { Metadata } from "next";

// La página del carrito es un componente cliente y no puede exportar metadata.
export const metadata: Metadata = {
  title: "Tu carrito",
  robots: { index: false },
};

export default function LayoutCarrito({ children }: { children: React.ReactNode }) {
  return children;
}
