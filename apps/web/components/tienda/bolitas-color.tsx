"use client";

import Image from "next/image";
import type { Variante } from "@/lib/tipos";
import { cn } from "@/lib/utilidades";

/** Cuantas bolitas se muestran en la tarjeta antes de resumir con "+N". */
const MAX_VISIBLES = 4;

/**
 * Relleno visual de una bolita: el color hex de la variante o, si la variante
 * vieja no tiene hex cargado, un recorte de su primera foto efectiva. Asi nunca
 * aparece una bolita vacia en la tienda. El padre debe ser `relative`.
 */
export function RellenoBolita({ variante }: { variante: Variante }) {
  if (variante.colorHex) {
    return (
      <span
        aria-hidden
        className="block h-full w-full"
        style={{ backgroundColor: variante.colorHex }}
      />
    );
  }

  const foto = variante.imagenesEfectivas?.[0]?.url ?? null;
  if (foto) {
    return <Image src={foto} alt="" fill sizes="32px" className="object-cover" />;
  }

  return <span aria-hidden className="block h-full w-full bg-perla" />;
}

interface PropsBolitasColor {
  variantes: Variante[];
  varianteSeleccionadaId: string | null;
  alSeleccionar: (variante: Variante) => void;
  className?: string;
}

/**
 * Fila compacta de bolitas de color para la tarjeta del catalogo: muestra en
 * que colores viene el modelo y permite previsualizar la foto de cada uno sin
 * entrar al detalle. Convive con el enlace "stretched" de la tarjeta como
 * hermano, por eso se eleva (z-20) y corta la propagacion del click.
 */
export function BolitasColor({
  variantes,
  varianteSeleccionadaId,
  alSeleccionar,
  className,
}: PropsBolitasColor) {
  const visibles = variantes.slice(0, MAX_VISIBLES);
  const restantes = variantes.length - visibles.length;

  const alElegir = (
    evento: React.MouseEvent<HTMLButtonElement>,
    variante: Variante,
  ) => {
    evento.preventDefault();
    evento.stopPropagation();
    alSeleccionar(variante);
  };

  return (
    <div className={cn("relative z-20 flex items-center gap-2", className)}>
      {visibles.map((variante) => {
        const activa = variante.id === varianteSeleccionadaId;
        return (
          <button
            key={variante.id}
            type="button"
            aria-pressed={activa}
            aria-label={`Ver en ${variante.color}`}
            title={variante.color}
            onClick={(evento) => alElegir(evento, variante)}
            className={cn(
              "relative h-6 w-6 overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)] transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento focus-visible:ring-offset-1 motion-reduce:transition-none sm:h-[18px] sm:w-[18px]",
              activa && "ring-2 ring-acento ring-offset-1",
            )}
          >
            <RellenoBolita variante={variante} />
          </button>
        );
      })}
      {restantes > 0 && (
        <span className="text-[11px] text-texto">+{restantes}</span>
      )}
    </div>
  );
}
