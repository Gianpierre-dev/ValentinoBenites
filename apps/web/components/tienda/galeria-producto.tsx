"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  IconChevronLeft,
  IconChevronRight,
  IconX,
  IconZoomIn,
} from "@tabler/icons-react";
import type { ImagenEfectiva } from "@/lib/tipos";
import { cn } from "@/lib/utilidades";

interface PropsGaleriaProducto {
  imagenes: ImagenEfectiva[];
  nombre: string;
}

/**
 * Galeria del detalle de producto: imagen principal grande y miniaturas
 * seleccionables. Al hacer click en la principal abre un lightbox a pantalla
 * completa con navegación. Degrada a un placeholder si no hay imagenes.
 */
export function GaleriaProducto({ imagenes, nombre }: PropsGaleriaProducto) {
  const ordenadas = [...imagenes].sort((a, b) => a.orden - b.orden);
  const [activa, setActiva] = useState(0);
  const [ampliada, setAmpliada] = useState(false);

  if (ordenadas.length === 0) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-2xl border border-borde bg-perla text-xs uppercase tracking-wide text-texto/50">
        Sin imagen
      </div>
    );
  }

  const indiceSeguro = Math.min(activa, ordenadas.length - 1);
  const principal = ordenadas[indiceSeguro] ?? ordenadas[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        {/* Halo morado difuso para dar profundidad, como en el hero del home. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-4 -z-10 rounded-[2.5rem] bg-acento/10 blur-2xl"
        />
        <button
          type="button"
          onClick={() => setAmpliada(true)}
          aria-label={`Ampliar imagen de ${nombre}`}
          className="group relative block aspect-[3/4] w-full cursor-zoom-in overflow-hidden rounded-[2rem] bg-perla shadow-2xl shadow-acento/15 ring-1 ring-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento focus-visible:ring-offset-2"
        >
          <Image
            src={principal.url}
            alt={nombre}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-suave group-hover:scale-[1.03]"
          />
          <span
            aria-hidden
            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-texto-fuerte/60 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100"
          >
            <IconZoomIn size={18} />
          </span>
        </button>
      </div>

      {ordenadas.length > 1 && (
        <ul className="grid grid-cols-4 gap-3">
          {ordenadas.map((imagen, indice) => (
            <li key={imagen.id}>
              <button
                type="button"
                onClick={() => setActiva(indice)}
                aria-label={`Ver imagen ${indice + 1} de ${nombre}`}
                aria-pressed={indice === indiceSeguro}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-xl border-2 bg-perla transition-all",
                  indice === indiceSeguro
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

      {ampliada && (
        <Lightbox
          imagenes={ordenadas}
          nombre={nombre}
          indiceInicial={indiceSeguro}
          alCerrar={(indiceFinal) => {
            setActiva(indiceFinal);
            setAmpliada(false);
          }}
        />
      )}
    </div>
  );
}

interface PropsLightbox {
  imagenes: ImagenEfectiva[];
  nombre: string;
  indiceInicial: number;
  /** Devuelve el índice visible al cerrar para sincronizar la galería. */
  alCerrar: (indiceFinal: number) => void;
}

/**
 * Visor a pantalla completa: navegación con flechas/teclado, cierre con X,
 * Escape o click en el fondo. Dialogo modal con foco atrapado y retorno de foco.
 */
function Lightbox({ imagenes, nombre, indiceInicial, alCerrar }: PropsLightbox) {
  const [indice, setIndice] = useState(indiceInicial);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const focoPrevioRef = useRef<HTMLElement | null>(null);
  const total = imagenes.length;

  const cerrar = useCallback(() => alCerrar(indice), [alCerrar, indice]);
  const anterior = useCallback(
    () => setIndice((actual) => (actual - 1 + total) % total),
    [total],
  );
  const siguiente = useCallback(
    () => setIndice((actual) => (actual + 1) % total),
    [total],
  );

  // Bloquea el scroll del fondo, guarda/restaura el foco y mueve el foco al modal.
  useEffect(() => {
    focoPrevioRef.current = document.activeElement as HTMLElement | null;
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    contenedorRef.current?.focus();

    return () => {
      document.body.style.overflow = overflowPrevio;
      focoPrevioRef.current?.focus();
    };
  }, []);

  const alPresionarTecla = (evento: React.KeyboardEvent) => {
    if (evento.key === "Escape") {
      evento.preventDefault();
      cerrar();
    } else if (evento.key === "ArrowLeft" && total > 1) {
      anterior();
    } else if (evento.key === "ArrowRight" && total > 1) {
      siguiente();
    } else if (evento.key === "Tab") {
      // Foco atrapado: sin elementos fuera, mantenemos el foco en el contenedor.
      evento.preventDefault();
    }
  };

  const actual = imagenes[indice] ?? imagenes[0];

  return (
    <div
      ref={contenedorRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Imagen ampliada de ${nombre}`}
      tabIndex={-1}
      onKeyDown={alPresionarTecla}
      onClick={cerrar}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm focus:outline-none sm:p-8"
    >
      <button
        type="button"
        onClick={cerrar}
        aria-label="Cerrar imagen ampliada"
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <IconX size={22} aria-hidden />
      </button>

      {total > 1 && (
        <button
          type="button"
          onClick={(evento) => {
            evento.stopPropagation();
            anterior();
          }}
          aria-label="Imagen anterior"
          className="absolute left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-6"
        >
          <IconChevronLeft size={24} aria-hidden />
        </button>
      )}

      {/* El click sobre la imagen no cierra (solo el fondo). */}
      <div
        onClick={(evento) => evento.stopPropagation()}
        className="relative h-full max-h-[85vh] w-full max-w-4xl"
      >
        <Image
          src={actual.url}
          alt={`${nombre} — imagen ${indice + 1} de ${total}`}
          fill
          sizes="90vw"
          className="object-contain"
        />
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={(evento) => {
              evento.stopPropagation();
              siguiente();
            }}
            aria-label="Imagen siguiente"
            className="absolute right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-6"
          >
            <IconChevronRight size={24} aria-hidden />
          </button>
          <p
            aria-live="polite"
            className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white"
          >
            {indice + 1} / {total}
          </p>
        </>
      )}
    </div>
  );
}
