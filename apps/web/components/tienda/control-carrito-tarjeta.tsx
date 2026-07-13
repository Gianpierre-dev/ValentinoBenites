"use client";

import { useState } from "react";
import { IconMinus, IconPlus, IconShoppingBagPlus } from "@tabler/icons-react";
import { useCarrito } from "@/store/carrito";
import type { Producto } from "@/lib/tipos";

interface PropsControlCarritoTarjeta {
  producto: Producto;
}

/**
 * Accion de carrito en el pie de la tarjeta del catalogo (patron clasico de
 * ecommerce): un selector de cantidad − N + siempre visible junto al boton
 * "Agregar". TODAS las tarjetas se ven iguales, sin importar cuantos colores
 * tenga el modelo. El color solo se elige DENTRO de la ficha del producto.
 *
 * - Modelo de un solo color -> agrega esa variante.
 * - Modelo multi-color -> se agrega "a coordinar" (sin color comprometido); el
 *   cliente elige el color en la ficha o se define por WhatsApp al confirmar.
 *
 * Convive con el enlace "stretched" de la tarjeta: va en `z-20` (por encima) y
 * ademas corta la propagacion, para que interactuar aqui no navegue al producto.
 */
export function ControlCarritoTarjeta({ producto }: PropsControlCarritoTarjeta) {
  const variantes = producto.variantes ?? [];
  const varianteUnica = variantes.length === 1 ? variantes[0] : null;

  const agregar = useCarrito((estado) => estado.agregar);
  const agregarSinColor = useCarrito((estado) => estado.agregarSinColor);
  const [cantidad, setCantidad] = useState(1);

  const cortar = (evento: React.MouseEvent<HTMLElement>) => {
    evento.preventDefault();
    evento.stopPropagation();
  };

  // Modelo sin variantes activas: no hay nada que agregar.
  if (variantes.length === 0) return null;

  // Selector de cantidad + Agregar, siempre visibles (single y multi-color).
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
    if (varianteUnica) {
      agregar(producto, varianteUnica, cantidad);
    } else {
      // Multi-color: entra "a coordinar", el color se define despues.
      agregarSinColor(producto, cantidad);
    }
    setCantidad(1);
  };

  return (
    <div className="relative z-20 mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
      <div
        role="group"
        aria-label={`Cantidad de ${producto.nombre}`}
        className="flex h-11 w-full items-center justify-between rounded-full border border-borde bg-superficie px-1 sm:inline-flex sm:w-auto sm:shrink-0 sm:justify-start"
      >
        <button
          type="button"
          onClick={bajar}
          aria-label="Quitar uno"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-texto-fuerte transition-colors hover:bg-acento/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento motion-reduce:transition-none sm:h-8 sm:w-8"
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
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-texto-fuerte transition-colors hover:bg-acento/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento motion-reduce:transition-none sm:h-8 sm:w-8"
        >
          <IconPlus size={16} aria-hidden />
        </button>
      </div>
      <button
        type="button"
        onClick={alAgregar}
        aria-label={`Agregar ${producto.nombre} al carrito`}
        className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-acento px-4 text-sm font-medium text-acento-contraste transition-all duration-300 ease-suave hover:bg-acento/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:transition-none sm:w-auto sm:flex-1"
      >
        <IconShoppingBagPlus size={18} aria-hidden />
        Agregar
      </button>
    </div>
  );
}
