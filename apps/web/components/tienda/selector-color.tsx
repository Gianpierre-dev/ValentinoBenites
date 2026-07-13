"use client";

import { useRef } from "react";
import type { Variante } from "@/lib/tipos";
import { cn } from "@/lib/utilidades";
import { RellenoBolita } from "./bolitas-color";

interface PropsSelectorColor {
  variantes: Variante[];
  varianteSeleccionadaId: string;
  alSeleccionar: (variante: Variante) => void;
}

/**
 * Selector de color del detalle: fila de bolitas, una por variante (color).
 * La bolita se pinta con el hex de la variante (fallback: recorte de su primera
 * foto); la seleccionada lleva anillo marcado y el nombre se muestra arriba.
 * Modelo hecho-a-pedido: nunca hay "agotado", todas las variantes estan
 * siempre disponibles.
 *
 * Accesibilidad: `radiogroup` con roving tabindex y navegacion por flechas.
 */
export function SelectorColor({
  variantes,
  varianteSeleccionadaId,
  alSeleccionar,
}: PropsSelectorColor) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  if (variantes.length <= 1) {
    // Con un solo color no tiene sentido mostrar un selector.
    return null;
  }

  const indiceActual = variantes.findIndex(
    (variante) => variante.id === varianteSeleccionadaId,
  );

  const moverA = (indice: number) => {
    const total = variantes.length;
    const destino = (indice + total) % total;
    alSeleccionar(variantes[destino]);
    refs.current[destino]?.focus();
  };

  const alPresionarTecla = (evento: React.KeyboardEvent) => {
    switch (evento.key) {
      case "ArrowRight":
      case "ArrowDown":
        evento.preventDefault();
        moverA(indiceActual + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        evento.preventDefault();
        moverA(indiceActual - 1);
        break;
      default:
        break;
    }
  };

  const seleccionada = variantes[indiceActual] ?? variantes[0];

  return (
    <div className="flex flex-col gap-2">
      <p className="titulo-ui text-xs font-semibold uppercase tracking-[0.15em] text-texto">
        Color:{" "}
        <span className="text-texto-fuerte">{seleccionada?.color}</span>
      </p>
      <div
        role="radiogroup"
        aria-label="Color"
        onKeyDown={alPresionarTecla}
        className="flex flex-wrap gap-3"
      >
        {variantes.map((variante, indice) => {
          const activa = variante.id === varianteSeleccionadaId;

          return (
            <button
              key={variante.id}
              ref={(elemento) => {
                refs.current[indice] = elemento;
              }}
              type="button"
              role="radio"
              aria-checked={activa}
              aria-label={variante.color}
              title={variante.color}
              tabIndex={activa || (indiceActual < 0 && indice === 0) ? 0 : -1}
              onClick={() => alSeleccionar(variante)}
              className={cn(
                "relative block h-11 w-11 overflow-hidden rounded-full bg-perla shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento focus-visible:ring-offset-2 motion-reduce:transition-none sm:h-8 sm:w-8",
                activa
                  ? "ring-2 ring-acento ring-offset-2"
                  : "hover:scale-110",
              )}
            >
              <RellenoBolita variante={variante} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
