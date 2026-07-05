"use client";

import Link from "next/link";
import { IconHeart } from "@tabler/icons-react";
import { useFavoritos } from "@/store/favoritos";
import { useHidratadoFavoritos } from "@/store/usar-hidratado";

/**
 * Enlace a la pagina de favoritos con contador. Lee el store persistido;
 * muestra el contador solo cuando la persistencia termino de hidratar para
 * evitar el desfase de hidratacion (SSR vs cliente).
 */
export function IconoFavoritos() {
  const montado = useHidratadoFavoritos();
  const cantidad = useFavoritos((estado) => estado.cantidad());

  return (
    <Link
      href="/favoritos"
      aria-label={`Ver favoritos${montado && cantidad > 0 ? `, ${cantidad} productos` : ""}`}
      className="relative inline-flex h-10 w-10 items-center justify-center text-texto-fuerte transition-colors hover:text-acento"
    >
      <IconHeart size={22} stroke={1.5} aria-hidden />
      {montado && cantidad > 0 && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-acento px-1 text-[11px] font-semibold text-acento-contraste">
          {cantidad > 99 ? "99+" : cantidad}
        </span>
      )}
    </Link>
  );
}
