"use client";

import Link from "next/link";
import { useState } from "react";
import { IconMenu2, IconX } from "@tabler/icons-react";
import type { Categoria } from "@/lib/tipos";
import { cn } from "@/lib/utilidades";

interface PropsNavCategorias {
  categorias: Categoria[];
}

/**
 * Navegacion por categorias: inline en desktop, menu desplegable en mobile.
 * Recibe las categorias ya cargadas por el Encabezado (server component).
 */
export function NavCategorias({ categorias }: PropsNavCategorias) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <nav aria-label="Categorias" className="hidden md:block">
        <ul className="flex items-center gap-6">
          {categorias.map((categoria) => (
            <li key={categoria.id}>
              <Link
                href={`/catalogo?categoria=${categoria.slug}`}
                className="text-sm uppercase tracking-wide text-texto transition-colors hover:text-acento"
              >
                {categoria.nombre}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <button
        type="button"
        aria-label={abierto ? "Cerrar menu" : "Abrir menu"}
        aria-expanded={abierto}
        onClick={() => setAbierto((previo) => !previo)}
        className="inline-flex h-10 w-10 items-center justify-center text-texto-fuerte md:hidden"
      >
        {abierto ? <IconX size={22} aria-hidden /> : <IconMenu2 size={22} aria-hidden />}
      </button>

      <div
        className={cn(
          "absolute inset-x-0 top-full border-b border-borde bg-fondo md:hidden",
          abierto ? "block" : "hidden",
        )}
      >
        <nav aria-label="Categorias" className="px-4 py-2">
          <ul className="flex flex-col">
            {categorias.map((categoria) => (
              <li key={categoria.id}>
                <Link
                  href={`/catalogo?categoria=${categoria.slug}`}
                  onClick={() => setAbierto(false)}
                  className="block py-3 text-sm uppercase tracking-wide text-texto transition-colors hover:text-acento"
                >
                  {categoria.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
