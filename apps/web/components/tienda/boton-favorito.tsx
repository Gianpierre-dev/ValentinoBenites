"use client";

import { IconHeart, IconHeartFilled } from "@tabler/icons-react";
import { useFavoritos } from "@/store/favoritos";
import { useHidratadoFavoritos } from "@/store/usar-hidratado";
import { cn } from "@/lib/utilidades";
import type { Producto } from "@/lib/tipos";

interface PropsBotonFavorito {
  producto: Producto;
  /** Clases extra para posicionar/estilar segun el contexto (tarjeta o detalle). */
  className?: string;
}

/**
 * Corazon para marcar/desmarcar un producto como favorito (persistido en
 * localStorage). Hasta que el store hidrata se muestra desmarcado, evitando
 * el desfase SSR vs cliente. En la tarjeta del catalogo convive con el enlace
 * "stretched" como hermano, por eso corta la propagacion del click.
 */
export function BotonFavorito({ producto, className }: PropsBotonFavorito) {
  const montado = useHidratadoFavoritos();
  const alternar = useFavoritos((estado) => estado.alternar);
  const esFavorito = useFavoritos((estado) => estado.esFavorito(producto.id));
  const marcado = montado && esFavorito;

  const alAlternar = (evento: React.MouseEvent<HTMLButtonElement>) => {
    evento.preventDefault();
    evento.stopPropagation();
    alternar(producto);
  };

  return (
    <button
      type="button"
      onClick={alAlternar}
      aria-pressed={marcado}
      aria-label={
        marcado
          ? `Quitar ${producto.nombre} de favoritos`
          : `Agregar ${producto.nombre} a favoritos`
      }
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento motion-reduce:transition-none sm:h-10 sm:w-10",
        marcado ? "text-acento" : "text-texto/60 hover:text-acento",
        className,
      )}
    >
      {marcado ? (
        <IconHeartFilled size={20} aria-hidden />
      ) : (
        <IconHeart size={20} stroke={1.75} aria-hidden />
      )}
    </button>
  );
}
