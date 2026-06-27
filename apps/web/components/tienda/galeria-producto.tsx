"use client";

import { useState } from "react";
import Image from "next/image";
import type { ImagenProducto } from "@/lib/tipos";
import { cn } from "@/lib/utilidades";

interface PropsGaleriaProducto {
  imagenes: ImagenProducto[];
  nombre: string;
}

/**
 * Galeria del detalle de producto: imagen principal grande y miniaturas
 * seleccionables. Degrada a un placeholder si no hay imagenes.
 */
export function GaleriaProducto({ imagenes, nombre }: PropsGaleriaProducto) {
  const ordenadas = [...imagenes].sort((a, b) => a.orden - b.orden);
  const [activa, setActiva] = useState(0);

  if (ordenadas.length === 0) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-2xl border border-borde bg-perla text-xs uppercase tracking-wide text-texto/50">
        Sin imagen
      </div>
    );
  }

  const principal = ordenadas[activa] ?? ordenadas[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        {/* Halo morado difuso para dar profundidad, como en el hero del home. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-4 -z-10 rounded-[2.5rem] bg-acento/10 blur-2xl"
        />
        <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] bg-perla shadow-2xl shadow-acento/15 ring-1 ring-black/5">
          <Image
            src={principal.url}
            alt={nombre}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>

      {ordenadas.length > 1 && (
        <ul className="grid grid-cols-4 gap-3">
          {ordenadas.map((imagen, indice) => (
            <li key={imagen.id}>
              <button
                type="button"
                onClick={() => setActiva(indice)}
                aria-label={`Ver imagen ${indice + 1} de ${nombre}`}
                aria-pressed={indice === activa}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-xl border-2 bg-perla transition-all",
                  indice === activa
                    ? "border-acento ring-2 ring-acento/20"
                    : "border-transparent hover:border-acento/40",
                )}
              >
                <Image
                  src={imagen.url}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
