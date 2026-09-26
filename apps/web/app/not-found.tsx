import type { Metadata } from "next";
import Link from "next/link";
import { IconShoppingBag } from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false },
};

/** 404 de todo el sitio: rutas inexistentes y productos que ya no se venden. */
export default function NoEncontrado() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-rosa-fuerte to-fondo px-4 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-acento/10 text-acento">
        <IconShoppingBag size={32} aria-hidden />
      </span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-acento">
        Error 404
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-texto-fuerte sm:text-4xl">
        No encontramos esta página
      </h1>
      <p className="mt-3 max-w-md text-texto">
        Es posible que el enlace esté mal escrito o que el producto ya no esté
        disponible. Te invitamos a ver nuestro catálogo actual.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/catalogo"
          className="inline-flex items-center rounded-full bg-acento px-6 py-3 text-sm font-semibold text-acento-contraste transition-colors hover:bg-acento/90"
        >
          Ver catálogo
        </Link>
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-borde px-6 py-3 text-sm font-semibold text-texto-fuerte transition-colors hover:border-acento/40 hover:text-acento"
        >
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
