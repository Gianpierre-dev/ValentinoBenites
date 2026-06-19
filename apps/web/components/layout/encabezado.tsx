import Link from "next/link";
import { listarCategorias } from "@/lib/api";
import type { Categoria } from "@/lib/tipos";
import { IconoCarrito } from "./icono-carrito";
import { NavCategorias } from "./nav-categorias";

/**
 * Header del storefront: logo FABIOLA, navegacion de categorias (cargadas de la API)
 * e icono del carrito con contador. Server component; degrada sin romper si la API
 * de categorias no responde.
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
          aria-label="FABIOLA, ir al inicio"
          className="text-xl font-semibold uppercase tracking-[0.3em] text-texto-fuerte"
        >
          Fabiola
        </Link>

        <NavCategorias categorias={categorias} />

        <div className="flex items-center">
          <IconoCarrito />
        </div>
      </div>
    </header>
  );
}
