"use client";

import { useEffect, useRef } from "react";

/** Mensaje mostrado si la clienta aun no configuro ninguno. */
const MENSAJE_FALLBACK = "Envíos gratis a todo el Perú";

/**
 * Velocidad del desplazamiento en px/seg (medida del scrolling_promotion de
 * paez.com.pe). La duracion se calcula segun el ancho real de la tira, asi el
 * ritmo es constante sin importar cuantos mensajes configure la clienta.
 */
const VELOCIDAD_PX_SEG = 6;

/** Separador visual entre mensajes dentro de la tira. */
const SEPARADOR = "•";

interface BarraAnunciosProps {
  /** Mensajes administrados desde Configuracion → Barra de anuncios. */
  mensajes: string[];
  /** false = la barra no se renderiza (apagada desde el admin). */
  activa: boolean;
}

/**
 * Barra de anuncios (marquee) fija sobre el encabezado: una tira rosa de marca
 * que desplaza los mensajes promocionales en loop horizontal continuo. El texto
 * va en el acento morado sobre el rosa suave, separada del header blanco por un
 * borde tenue. El desplazamiento es siempre activo (decision de producto); se
 * pausa al pasar el mouse por encima.
 */
export function BarraAnuncios({ mensajes, activa }: BarraAnunciosProps) {
  const limpios = mensajes
    .map((mensaje) => mensaje.trim())
    .filter((mensaje) => mensaje.length > 0);
  const aMostrar = limpios.length > 0 ? limpios : [MENSAJE_FALLBACK];

  const trackRef = useRef<HTMLDivElement>(null);
  const claveMensajes = aMostrar.join("|");

  // La tira recorre el 50% de su ancho por ciclo (esta duplicada). Duracion =
  // distancia / velocidad, seteada como CSS var sobre el propio elemento para
  // no re-renderizar. Se recalcula si cambian los mensajes o el viewport.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const ajustar = () => {
      const distancia = track.scrollWidth / 2;
      track.style.setProperty(
        "--duracion-anuncios",
        `${Math.max(10, Math.round(distancia / VELOCIDAD_PX_SEG))}s`,
      );
    };
    ajustar();
    const observador = new ResizeObserver(ajustar);
    observador.observe(track);
    return () => observador.disconnect();
  }, [claveMensajes]);

  // Apagada desde el admin: no ocupa espacio ni se anuncia.
  if (!activa) return null;

  return (
    <aside
      aria-label="Anuncios de la tienda"
      className="group w-full overflow-hidden border-b border-acento/10 bg-rosa-fuerte py-2 text-xs font-semibold uppercase tracking-[0.2em] text-acento"
    >
      <div ref={trackRef} className="marquee-anuncios flex w-max whitespace-nowrap">
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
          animation: desplazar-anuncios var(--duracion-anuncios, 90s) linear infinite;
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
          <span aria-hidden className="opacity-50">
            {SEPARADOR}
          </span>
        </span>
      ))}
    </div>
  );
}
