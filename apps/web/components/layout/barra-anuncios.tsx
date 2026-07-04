/** Mensaje mostrado si la clienta aun no configuro ninguno. */
const MENSAJE_FALLBACK = "Envíos gratis a todo el Perú";

/** Separador visual entre mensajes dentro de la tira. */
const SEPARADOR = "•";

/**
 * Velocidad objetivo del desplazamiento en px/seg (lectura pausada; Paez corre
 * a ~10 px/s). La duracion se calcula EN EL SERVIDOR a partir del largo de los
 * mensajes y queda impresa en el HTML: no depende de JavaScript en el navegador,
 * asi el ritmo es identico desde el primer frame en cualquier maquina.
 */
const VELOCIDAD_PX_SEG = 3;

/** Ancho estimado por caracter (text-xs uppercase con tracking amplio). */
const PX_POR_CARACTER = 9;

/** Padding + separador por mensaje (px-6 a cada lado + el punto). */
const PX_POR_MENSAJE = 70;

interface BarraAnunciosProps {
  /** Mensajes administrados desde Configuracion → Barra de anuncios. */
  mensajes: string[];
  /** false = la barra no se renderiza (apagada desde el admin). */
  activa: boolean;
}

/**
 * Barra de anuncios (marquee) fija sobre el encabezado: una tira rosa de marca
 * que desplaza los mensajes promocionales en loop horizontal continuo, con el
 * texto en el acento morado. Server component deliberadamente: la duracion de
 * la animacion viaja en el HTML (estimada por el largo del contenido), sin
 * calibracion en cliente ni ventana de hidratacion. Se pausa al pasar el mouse.
 */
export function BarraAnuncios({ mensajes, activa }: BarraAnunciosProps) {
  const limpios = mensajes
    .map((mensaje) => mensaje.trim())
    .filter((mensaje) => mensaje.length > 0);
  const aMostrar = limpios.length > 0 ? limpios : [MENSAJE_FALLBACK];

  // Apagada desde el admin: no ocupa espacio ni se anuncia.
  if (!activa) return null;

  // Estimacion server-side del ancho de UNA pasada de la tira (la mitad del
  // track duplicado): caracteres + padding/separador por mensaje.
  const caracteres = aMostrar.reduce((suma, m) => suma + m.length, 0);
  const anchoEstimado =
    caracteres * PX_POR_CARACTER + aMostrar.length * PX_POR_MENSAJE;
  const duracionSegundos = Math.max(
    30,
    Math.round(anchoEstimado / VELOCIDAD_PX_SEG),
  );

  return (
    <aside
      aria-label="Anuncios de la tienda"
      className="group w-full overflow-hidden border-b border-acento/10 bg-rosa-fuerte py-2 text-xs font-semibold uppercase tracking-[0.2em] text-acento"
    >
      <div
        className="marquee-anuncios flex w-max whitespace-nowrap"
        style={{ animationDuration: `${duracionSegundos}s` }}
      >
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
          animation-name: desplazar-anuncios;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
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
