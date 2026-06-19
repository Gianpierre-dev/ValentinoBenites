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
      <div className="flex aspect-[3/4] items-center justify-center border border-borde bg-black/[.02] text-xs uppercase tracking-wide text-texto/50">
        Sin imagen
      </div>
    );
  }

  const principal = ordenadas[activa] ?? ordenadas[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[3/4] overflow-hidden border border-borde bg-black/[.02]">
        <Image
          src={principal.url}
          alt={nombre}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
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
                  "relative block aspect-square w-full overflow-hidden border bg-black/[.02] transition-colors",
                  indice === activa ? "border-acento" : "border-borde hover:border-texto/40",
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
