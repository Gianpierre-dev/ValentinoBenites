"use client";

import { IconShoppingBagPlus } from "@tabler/icons-react";
import { useCarrito } from "@/store/carrito";
import type { Producto } from "@/lib/tipos";

interface PropsBotonAgregarRapido {
  producto: Producto;
}

/**
 * Accion rapida de "Agregar" sobre la tarjeta del catalogo: agrega el primer color
 * del modelo al carrito y abre el panel lateral, sin entrar al detalle. Se renderiza
 * como hermano del enlace de la tarjeta (no anidado), por eso no navega al detalle;
 * igual cortamos la propagacion por seguridad. Si el modelo no tiene colores
 * disponibles, no se muestra (nada que agregar).
 */
export function BotonAgregarRapido({ producto }: PropsBotonAgregarRapido) {
  const agregar = useCarrito((estado) => estado.agregar);
  const variantePorDefecto = producto.variantes?.[0];

  if (!variantePorDefecto) return null;

  const alAgregar = (evento: React.MouseEvent<HTMLButtonElement>) => {
    evento.preventDefault();
    evento.stopPropagation();
    agregar(producto, variantePorDefecto, 1);
  };

  return (
    <button
      type="button"
      onClick={alAgregar}
      aria-label={`Agregar ${producto.nombre} al carrito`}
      className="absolute bottom-3 right-3 z-10 inline-flex h-10 items-center gap-1.5 rounded-full bg-acento px-4 text-sm font-medium text-acento-contraste shadow-lg transition-all duration-200 hover:opacity-90 focus-visible:opacity-90 motion-reduce:transition-none sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus-visible:translate-y-0 sm:focus-visible:opacity-100"
    >
      <IconShoppingBagPlus size={18} aria-hidden />
      Agregar
    </button>
  );
}
