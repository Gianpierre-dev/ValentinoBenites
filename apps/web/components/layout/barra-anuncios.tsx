"use client";

import { useSyncExternalStore } from "react";

/** Mensaje mostrado si la clienta aun no configuro ninguno. */
const MENSAJE_FALLBACK = "Envíos gratis a todo el Perú";

/** Separador visual entre mensajes dentro de la tira. */
const SEPARADOR = "•";

interface BarraAnunciosProps {
  /** Mensajes administrados desde Configuracion → Barra de anuncios. */
  mensajes: string[];
  /** false = la barra no se renderiza (apagada desde el admin). */
  activa: boolean;
}

/**
 * Barra de anuncios (marquee) fija sobre el encabezado: una tira finita que
 * desplaza mensajes promocionales en loop horizontal continuo. Si el usuario
 * prefiere movimiento reducido, los mensajes se muestran estaticos y centrados.
 */
export function BarraAnuncios({ mensajes, activa }: BarraAnunciosProps) {
  const limpios = mensajes
    .map((mensaje) => mensaje.trim())
    .filter((mensaje) => mensaje.length > 0);
  const aMostrar = limpios.length > 0 ? limpios : [MENSAJE_FALLBACK];

  const reduceMovimiento = useMovimientoReducido();

  // Apagada desde el admin: no ocupa espacio ni se anuncia.
  if (!activa) return null;

  // Movimiento reducido: mensajes estaticos y centrados, sin animacion.
  if (reduceMovimiento) {
    return (
      <aside
        aria-label="Anuncios de la tienda"
        className="w-full bg-acento py-2 text-center text-xs font-medium uppercase tracking-[0.2em] text-white"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4">
          {aMostrar.map((mensaje, indice) => (
            <span key={`${indice}-${mensaje}`} className="inline-flex items-center gap-3">
              {indice > 0 && <span aria-hidden>{SEPARADOR}</span>}
              {mensaje}
            </span>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Anuncios de la tienda"
      className="group w-full overflow-hidden bg-acento py-2 text-xs font-medium uppercase tracking-[0.2em] text-white"
    >
      <div className="marquee-anuncios flex w-max whitespace-nowrap">
        <Tira mensajes={aMostrar} />
        {/* Copia duplicada para un loop continuo sin cortes; oculta a lectores. */}
        <Tira mensajes={aMostrar} aria-hidden />
      </div>

      <style>{`
        @keyframes desplazar-anuncios {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-anuncios {
          animation: desplazar-anuncios 30s linear infinite;
        }
        .group:hover .marquee-anuncios {
          animation-play-state: paused;
        }
      `}</style>
    </aside>
  );
}

interface TiraProps {
  mensajes: string[];
  "aria-hidden"?: boolean;
}

/** Una pasada de todos los mensajes separados por un punto. */
function Tira({ mensajes, "aria-hidden": ariaHidden }: TiraProps) {
  return (
    <div aria-hidden={ariaHidden} className="flex shrink-0 items-center">
      {mensajes.map((mensaje, indice) => (
        <span key={`${indice}-${mensaje}`} className="flex items-center">
          <span className="px-6">{mensaje}</span>
          <span aria-hidden className="opacity-60">
            {SEPARADOR}
          </span>
        </span>
      ))}
    </div>
  );
}

const CONSULTA_MOVIMIENTO = "(prefers-reduced-motion: reduce)";

function suscribirMovimiento(alCambiar: () => void): () => void {
  const consulta = window.matchMedia(CONSULTA_MOVIMIENTO);
  consulta.addEventListener("change", alCambiar);
  return () => consulta.removeEventListener("change", alCambiar);
}

/**
 * Detecta `prefers-reduced-motion` de forma reactiva. `useSyncExternalStore` es
 * la API de React para suscribirse a un store externo (aqui, el media query).
 */
function useMovimientoReducido(): boolean {
  return useSyncExternalStore(
    suscribirMovimiento,
    () => window.matchMedia(CONSULTA_MOVIMIENTO).matches,
    () => false,
  );
}
