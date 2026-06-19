"use client";

import Link from "next/link";
import { IconShoppingBag } from "@tabler/icons-react";
import { useCarrito } from "@/store/carrito";
import { useHidratado } from "@/store/usar-hidratado";

/**
 * Icono del carrito con contador de unidades.
 * Lee el store persistido; muestra el contador solo cuando la persistencia
 * termino de hidratar para evitar el desfase de hidratacion (SSR vs cliente).
 */
export function IconoCarrito() {
  const montado = useHidratado();
  const cantidad = useCarrito((estado) => estado.cantidadTotal());

  return (
    <Link
      href="/carrito"
      aria-label={`Carrito${montado && cantidad > 0 ? `, ${cantidad} productos` : ""}`}
      className="relative inline-flex h-10 w-10 items-center justify-center text-texto-fuerte transition-colors hover:text-acento"
    >
      <IconShoppingBag size={22} stroke={1.5} aria-hidden />
      {montado && cantidad > 0 && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-acento px-1 text-[11px] font-semibold text-acento-contraste">
          {cantidad > 99 ? "99+" : cantidad}
        </span>
      )}
    </Link>
  );
}
