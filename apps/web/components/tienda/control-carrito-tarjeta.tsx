"use client";

import { useState } from "react";
import Link from "next/link";
import { IconMinus, IconPlus, IconShoppingBagPlus } from "@tabler/icons-react";
import { useCarrito } from "@/store/carrito";
import type { Producto } from "@/lib/tipos";

interface PropsControlCarritoTarjeta {
  producto: Producto;
}

/**
 * Accion de carrito en el pie de la tarjeta del catalogo (patron clasico de
 * ecommerce): un selector de cantidad − N + siempre visible junto al boton
 * "Agregar". Al agregar se suma esa cantidad de la variante al carrito.
 *
 * Resuelve la ambiguedad de color: si el modelo tiene UNA sola variante activa
 * el agregado es inequivoco (selector + Agregar); si tiene 2 o mas colores no
 * se puede agregar a ciegas → "Elegir color" lleva a la ficha para decidir.
 *
 * Convive con el enlace "stretched" de la tarjeta: va en `z-20` (por encima) y
 * ademas corta la propagacion, para que interactuar aqui no navegue al producto.
 */
export function ControlCarritoTarjeta({ producto }: PropsControlCarritoTarjeta) {
  const variantes = producto.variantes ?? [];
  const varianteUnica = variantes.length === 1 ? variantes[0] : null;

  const agregar = useCarrito((estado) => estado.agregar);
  const [cantidad, setCantidad] = useState(1);

  const cortar = (evento: React.MouseEvent<HTMLElement>) => {
    evento.preventDefault();
    evento.stopPropagation();
  };

  // Modelo sin variantes activas: no hay nada que agregar.
  if (variantes.length === 0) return null;

  // Multi-color: la eleccion de color se decide en la ficha.
  if (!varianteUnica) {
    return (
      <Link
        href={`/producto/${producto.slug}`}
        aria-label={`Elegir color de ${producto.nombre}`}
        className="relative z-20 mt-3 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-acento px-4 text-sm font-medium text-acento-contraste transition-all duration-300 ease-suave hover:bg-acento/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento focus-visible:ring-offset-2 motion-reduce:transition-none"
      >
        <IconShoppingBagPlus size={18} aria-hidden />
        Elegir color
      </Link>
    );
  }

  // Variante unica: selector de cantidad + Agregar, siempre visibles.
  const bajar = (evento: React.MouseEvent<HTMLButtonElement>) => {
    cortar(evento);
    setCantidad((n) => Math.max(1, n - 1));
  };
  const subir = (evento: React.MouseEvent<HTMLButtonElement>) => {
    cortar(evento);
    setCantidad((n) => n + 1);
  };
  const alAgregar = (evento: React.MouseEvent<HTMLButtonElement>) => {
    cortar(evento);
    agregar(producto, varianteUnica, cantidad);
    setCantidad(1);
  };

  return (
    <div className="relative z-20 mt-3 flex items-center gap-2">
      <div
        role="group"
        aria-label={`Cantidad de ${producto.nombre}`}
        className="inline-flex h-11 shrink-0 items-center rounded-full border border-borde bg-superficie px-1"
      >
        <button
          type="button"
          onClick={bajar}
          aria-label="Quitar uno"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-texto-fuerte transition-colors hover:bg-acento/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento motion-reduce:transition-none"
        >
          <IconMinus size={16} aria-hidden />
        </button>
        <span
          aria-live="polite"
          className="min-w-6 px-1 text-center text-sm font-semibold text-texto-fuerte tabular-nums"
        >
          {cantidad}
        </span>
        <button
          type="button"
          onClick={subir}
          aria-label="Agregar uno más"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-texto-fuerte transition-colors hover:bg-acento/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento motion-reduce:transition-none"
        >
          <IconPlus size={16} aria-hidden />
        </button>
      </div>
      <button
        type="button"
        onClick={alAgregar}
        aria-label={`Agregar ${producto.nombre} al carrito`}
        className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-acento px-4 text-sm font-medium text-acento-contraste transition-all duration-300 ease-suave hover:bg-acento/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:transition-none"
      >
        <IconShoppingBagPlus size={18} aria-hidden />
        Agregar
      </button>
    </div>
  );
}
