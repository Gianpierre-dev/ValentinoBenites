"use client";

import Link from "next/link";
import {
  IconMinus,
  IconPlus,
  IconShoppingBagPlus,
} from "@tabler/icons-react";
import { useCarrito } from "@/store/carrito";
import type { Producto } from "@/lib/tipos";

interface PropsControlCarritoTarjeta {
  producto: Producto;
}

/**
 * Accion de carrito sobre la tarjeta del catalogo. Resuelve la ambiguedad de
 * color como un ecommerce real:
 *
 * - El modelo llega del backend con solo sus variantes ACTIVAS. Si tiene 2 o mas
 *   colores, agregar desde la tarjeta seria ambiguo (¿que color?) y el contador
 *   inline no podria representar cantidades por color distintas → mostramos
 *   "Elegir color" que lleva a la ficha para decidir alli.
 * - Si tiene UNA sola variante activa, el agregado es inequivoco: mostramos el
 *   boton "Agregar"; y si ya esta en el carrito, el stepper − cantidad + ligado
 *   a esa variante, sincronizado con el store del carrito.
 *
 * Se renderiza como hermano del enlace "stretched" de la tarjeta (no anidado),
 * pero igual cortamos la propagacion por seguridad.
 */
export function ControlCarritoTarjeta({ producto }: PropsControlCarritoTarjeta) {
  const variantes = producto.variantes ?? [];
  const varianteUnica = variantes.length === 1 ? variantes[0] : null;

  const agregar = useCarrito((estado) => estado.agregar);
  const cambiarCantidad = useCarrito((estado) => estado.cambiarCantidad);
  const quitar = useCarrito((estado) => estado.quitar);
  const linea = useCarrito((estado) =>
    varianteUnica
      ? estado.lineas.find((l) => l.varianteId === varianteUnica.id)
      : undefined,
  );

  // Modelo sin variantes activas: no hay nada que agregar.
  if (variantes.length === 0) return null;

  // Multi-color: la eleccion de color se decide en la ficha.
  if (!varianteUnica) {
    return (
      <Link
        href={`/producto/${producto.slug}`}
        aria-label={`Elegir color de ${producto.nombre}`}
        className="absolute bottom-3 right-3 z-20 inline-flex h-10 items-center gap-1.5 rounded-full bg-acento px-4 text-sm font-medium text-acento-contraste shadow-lg transition-all duration-200 hover:opacity-90 focus-visible:opacity-90 motion-reduce:transition-none sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus-visible:translate-y-0 sm:focus-visible:opacity-100"
      >
        <IconShoppingBagPlus size={18} aria-hidden />
        Elegir color
      </Link>
    );
  }

  const cortar = (evento: React.MouseEvent<HTMLElement>) => {
    evento.preventDefault();
    evento.stopPropagation();
  };

  // Variante unica aun no agregada: accion rapida de "Agregar".
  if (!linea) {
    return (
      <button
        type="button"
        onClick={(evento) => {
          cortar(evento);
          agregar(producto, varianteUnica, 1);
        }}
        aria-label={`Agregar ${producto.nombre} al carrito`}
        className="absolute bottom-3 right-3 z-20 inline-flex h-10 items-center gap-1.5 rounded-full bg-acento px-4 text-sm font-medium text-acento-contraste shadow-lg transition-all duration-200 hover:opacity-90 focus-visible:opacity-90 motion-reduce:transition-none sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus-visible:translate-y-0 sm:focus-visible:opacity-100"
      >
        <IconShoppingBagPlus size={18} aria-hidden />
        Agregar
      </button>
    );
  }

  // Ya en el carrito: stepper persistente ligado a la variante unica.
  const bajar = (evento: React.MouseEvent<HTMLButtonElement>) => {
    cortar(evento);
    if (linea.cantidad <= 1) {
      quitar(varianteUnica.id);
      return;
    }
    cambiarCantidad(varianteUnica.id, linea.cantidad - 1);
  };

  const subir = (evento: React.MouseEvent<HTMLButtonElement>) => {
    cortar(evento);
    cambiarCantidad(varianteUnica.id, linea.cantidad + 1);
  };

  return (
    <div
      role="group"
      aria-label={`Cantidad de ${producto.nombre} en el carrito`}
      className="absolute bottom-3 right-3 z-20 inline-flex h-10 items-center rounded-full bg-fondo/95 px-1 shadow-lg ring-1 ring-borde backdrop-blur-sm"
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
        className="min-w-7 px-1 text-center text-sm font-semibold text-texto-fuerte tabular-nums"
      >
        {linea.cantidad}
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
  );
}
