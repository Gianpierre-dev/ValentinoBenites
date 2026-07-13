"use client";

import { IconShoppingBag } from "@tabler/icons-react";
import { useCarrito } from "@/store/carrito";
import { useHidratado } from "@/store/usar-hidratado";

/**
 * Boton del carrito con contador de unidades. Abre el panel lateral (drawer).
 * Lee el store persistido; muestra el contador solo cuando la persistencia
 * termino de hidratar para evitar el desfase de hidratacion (SSR vs cliente).
 */
export function IconoCarrito() {
  const montado = useHidratado();
  const cantidad = useCarrito((estado) => estado.cantidadTotal());
  const abrir = useCarrito((estado) => estado.abrir);

  return (
    <button
      type="button"
      onClick={abrir}
      aria-label={`Abrir carrito${montado && cantidad > 0 ? `, ${cantidad} productos` : ""}`}
      className="relative inline-flex h-11 w-11 items-center justify-center text-texto-fuerte transition-colors hover:text-acento sm:h-10 sm:w-10"
    >
      <IconShoppingBag size={22} stroke={1.5} aria-hidden />
      {montado && cantidad > 0 && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-acento px-1 text-[11px] font-semibold text-acento-contraste">
          {cantidad > 99 ? "99+" : cantidad}
        </span>
      )}
    </button>
  );
}
