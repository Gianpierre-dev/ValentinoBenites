import Image from "next/image";
import Link from "next/link";
import { listarCategorias } from "@/lib/api";
import type { Categoria } from "@/lib/tipos";
import { IconoCarrito } from "./icono-carrito";
import { IconoFavoritos } from "./icono-favoritos";
import { NavCategorias } from "./nav-categorias";

/**
 * Header del storefront: logo Valentino Benites, navegacion de categorias (cargadas
 * de la API) e icono del carrito con contador. Server component; degrada sin romper
 * si la API de categorias no responde.
 */
export async function Encabezado() {
  let categorias: Categoria[] = [];
  try {
    categorias = await listarCategorias();
  } catch {
    categorias = [];
  }

  return (
    <header className="sticky top-0 z-40 border-b border-borde bg-fondo">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Valentino Benites, ir al inicio"
          className="flex items-center gap-2.5 text-texto-fuerte"
        >
          <Image
            src="/logo-valentino.png"
            alt="Valentino Benites"
            width={40}
            height={40}
            priority
            className="h-10 w-10 object-contain"
          />
          <span className="hidden text-base font-semibold uppercase tracking-[0.25em] sm:inline">
            Valentino Benites
          </span>
        </Link>

        <NavCategorias categorias={categorias} />

        <div className="flex items-center gap-1">
          <IconoFavoritos />
          <IconoCarrito />
        </div>
      </div>
    </header>
  );
}
