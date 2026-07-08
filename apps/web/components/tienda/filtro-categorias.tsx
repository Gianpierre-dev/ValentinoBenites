"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Categoria } from "@/lib/tipos";
import { cn } from "@/lib/utilidades";

interface PropsFiltroCategorias {
  categorias: Categoria[];
  /** Slug de la categoria activa; vacio = "Todos". */
  categoriaActiva?: string;
}

/**
 * Filtro de categorias del catalogo en forma de chips. Navega cambiando el query
 * param `categoria` y conserva la busqueda `q` activa.
 */
export function FiltroCategorias({
  categorias,
  categoriaActiva,
}: PropsFiltroCategorias) {
  const router = useRouter();
  const parametros = useSearchParams();

  // Sin categorias no hay nada que filtrar: el catalogo ya muestra todo.
  if (categorias.length === 0) return null;

  const irA = (slug?: string) => {
    const params = new URLSearchParams(parametros.toString());
    if (slug) {
      params.set("categoria", slug);
    } else {
      params.delete("categoria");
    }
    const consulta = params.toString();
    router.push(consulta ? `/catalogo?${consulta}` : "/catalogo");
  };

  const claseChip = (activa: boolean) =>
    cn(
      "inline-flex items-center gap-1.5 border px-4 py-2 text-sm uppercase tracking-wide transition-colors",
      activa
        ? "border-acento bg-acento text-acento-contraste"
        : "border-borde text-texto hover:border-acento/40 hover:text-acento",
    );

  const claseConteo = (activa: boolean) =>
    cn(
      "text-xs font-semibold tabular-nums",
      activa ? "text-acento-contraste/80" : "text-texto/50",
    );

  const total = categorias.reduce(
    (suma, categoria) => suma + (categoria.cantidadProductos ?? 0),
    0,
  );

  return (
    <nav aria-label="Filtrar por categoria">
      <ul className="flex flex-wrap gap-2">
        <li>
          <button
            type="button"
            onClick={() => irA(undefined)}
            aria-current={!categoriaActiva ? "true" : undefined}
            className={claseChip(!categoriaActiva)}
          >
            Todos
            {total > 0 && (
              <span className={claseConteo(!categoriaActiva)}>({total})</span>
            )}
          </button>
        </li>
        {categorias.map((categoria) => {
          const activa = categoria.slug === categoriaActiva;
          return (
            <li key={categoria.id}>
              <button
                type="button"
                onClick={() => irA(categoria.slug)}
                aria-current={activa ? "true" : undefined}
                className={claseChip(activa)}
              >
                {categoria.nombre}
                {categoria.cantidadProductos !== undefined && (
                  <span className={claseConteo(activa)}>
                    ({categoria.cantidadProductos})
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
