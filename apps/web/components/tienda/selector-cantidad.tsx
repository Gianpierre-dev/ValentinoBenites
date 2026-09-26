"use client";

import { IconMinus, IconPlus } from "@tabler/icons-react";
import { CANTIDAD_MAXIMA } from "@/store/carrito";

interface PropsSelectorCantidad {
  cantidad: number;
  alCambiar: (cantidad: number) => void;
  /** Tope superior; por defecto, el máximo por producto que acepta un pedido. */
  maximo?: number;
  idEtiqueta?: string;
}

/**
 * Control accesible para elegir cantidad: botones de menos/mas, entre 1 y el
 * máximo por producto.
 */
export function SelectorCantidad({
  cantidad,
  alCambiar,
  maximo = CANTIDAD_MAXIMA,
  idEtiqueta,
}: PropsSelectorCantidad) {
  const puedeBajar = cantidad > 1;
  const puedeSubir = cantidad < maximo;

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
