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

  // Siempre se ofrece "Catalogo"; las categorias se agregan solo si existen.
  const items = [
    { clave: "catalogo", etiqueta: "Catalogo", href: "/catalogo" },
    ...categorias.map((categoria) => ({
      clave: categoria.id,
      etiqueta: categoria.nombre,
      href: `/catalogo?categoria=${categoria.slug}`,
    })),
  ];

  return (
    <>
      <nav aria-label="Categorias" className="hidden md:block">
        <ul className="flex items-center gap-6">
          {items.map((item) => (
            <li key={item.clave}>
              <Link
                href={item.href}
                className="text-sm uppercase tracking-wide text-texto transition-colors hover:text-acento"
              >
                {item.etiqueta}
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
            {items.map((item) => (
              <li key={item.clave}>
                <Link
                  href={item.href}
                  onClick={() => setAbierto(false)}
                  className="block py-3 text-sm uppercase tracking-wide text-texto transition-colors hover:text-acento"
                >
                  {item.etiqueta}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
