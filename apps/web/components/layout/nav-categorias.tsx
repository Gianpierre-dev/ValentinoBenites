"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  const botonMenuRef = useRef<HTMLButtonElement>(null);

  // Esc cierra el menú móvil y devuelve el foco al botón que lo abrió.
  useEffect(() => {
    if (!abierto) return;
    const alPresionarTecla = (evento: KeyboardEvent) => {
      if (evento.key !== "Escape") return;
      setAbierto(false);
      botonMenuRef.current?.focus();
    };
    document.addEventListener("keydown", alPresionarTecla);
    return () => document.removeEventListener("keydown", alPresionarTecla);
  }, [abierto]);

  // Siempre se ofrecen "Catalogo" y "Nosotros" (la historia de marca es parte
  // de la venta); las categorias se intercalan solo si existen.
  const items = [
    { clave: "catalogo", etiqueta: "Catálogo", href: "/catalogo" },
    ...categorias.map((categoria) => ({
      clave: categoria.id,
      etiqueta: categoria.nombre,
      href: `/catalogo?categoria=${categoria.slug}`,
    })),
    { clave: "nosotros", etiqueta: "Nosotros", href: "/nosotros" },
  ];

  return (
    <>
      <nav aria-label="Categorías" className="hidden md:block">
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
        ref={botonMenuRef}
        type="button"
        aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={abierto}
        onClick={() => setAbierto((previo) => !previo)}
        className="inline-flex h-11 w-11 items-center justify-center text-texto-fuerte md:hidden"
      >
        {abierto ? <IconX size={22} aria-hidden /> : <IconMenu2 size={22} aria-hidden />}
      </button>

      <div
        className={cn(
          "absolute inset-x-0 top-full border-b border-borde bg-fondo md:hidden",
          abierto ? "block" : "hidden",
        )}
      >
        <nav aria-label="Categorías" className="px-4 py-2">
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
