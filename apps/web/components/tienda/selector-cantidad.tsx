"use client";

import { IconMinus, IconPlus } from "@tabler/icons-react";

interface PropsSelectorCantidad {
  cantidad: number;
  alCambiar: (cantidad: number) => void;
  /** Stock disponible; si es 0 no se aplica tope superior. */
  maximo?: number;
  idEtiqueta?: string;
}

/**
 * Control accesible para elegir cantidad: botones de menos/mas con tope en el stock.
 * Nunca baja de 1.
 */
export function SelectorCantidad({
  cantidad,
  alCambiar,
  maximo = 0,
  idEtiqueta,
}: PropsSelectorCantidad) {
  const hayTope = maximo > 0;
  const puedeBajar = cantidad > 1;
  const puedeSubir = !hayTope || cantidad < maximo;

  const bajar = () => {
    if (puedeBajar) alCambiar(cantidad - 1);
  };

  const subir = () => {
    if (puedeSubir) alCambiar(cantidad + 1);
  };

  return (
    <div
      className="inline-flex items-center border border-borde"
      role="group"
      aria-label="Seleccionar cantidad"
    >
      <button
        type="button"
        onClick={bajar}
        disabled={!puedeBajar}
        aria-label="Disminuir cantidad"
        className="inline-flex h-11 w-11 items-center justify-center text-texto-fuerte transition-colors hover:bg-black/[.04] disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
      >
        <IconMinus size={16} aria-hidden />
      </button>
      <span
        id={idEtiqueta}
        aria-live="polite"
        className="min-w-10 px-2 text-center text-sm font-medium text-texto-fuerte"
      >
        {cantidad}
      </span>
      <button
        type="button"
        onClick={subir}
        disabled={!puedeSubir}
        aria-label="Aumentar cantidad"
        className="inline-flex h-11 w-11 items-center justify-center text-texto-fuerte transition-colors hover:bg-black/[.04] disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
      >
        <IconPlus size={16} aria-hidden />
      </button>
    </div>
  );
}
