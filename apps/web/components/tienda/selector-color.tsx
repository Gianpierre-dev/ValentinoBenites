"use client";

import { useRef } from "react";
import Image from "next/image";
import type { Variante } from "@/lib/tipos";
import { cn } from "@/lib/utilidades";

interface PropsSelectorColor {
  variantes: Variante[];
  varianteSeleccionadaId: string;
  alSeleccionar: (variante: Variante) => void;
}

/**
 * Selector de color estilo Paez: fila de miniaturas, una por variante (color).
 * La miniatura usa la foto efectiva de la variante (con fallback a la del modelo);
 * la seleccionada lleva borde marcado. Modelo hecho-a-pedido: nunca hay "agotado",
 * todas las variantes estan siempre disponibles.
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
          const foto = variante.imagenesEfectivas?.[0]?.url ?? null;

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
              tabIndex={activa || (indiceActual < 0 && indice === 0) ? 0 : -1}
              onClick={() => alSeleccionar(variante)}
              className={cn(
                "relative block h-16 w-16 overflow-hidden rounded-xl border-2 bg-perla transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento focus-visible:ring-offset-2",
                activa
                  ? "border-acento ring-2 ring-acento/20"
                  : "border-transparent hover:border-acento/40",
              )}
            >
              {foto ? (
                <Image
                  src={foto}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="flex h-full w-full items-center justify-center"
                  style={
                    variante.colorHex
                      ? { backgroundColor: variante.colorHex }
                      : undefined
                  }
                >
                  {!variante.colorHex && (
                    <span className="text-[9px] uppercase text-texto/50">
                      {variante.color}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
