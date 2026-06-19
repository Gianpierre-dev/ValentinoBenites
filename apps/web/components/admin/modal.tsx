"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { IconX } from "@tabler/icons-react";
import { Boton } from "@/components/ui";

interface PropsModal {
  abierto: boolean;
  titulo: string;
  alCerrar: () => void;
  children: ReactNode;
  /** Ancho maximo del panel (clase Tailwind). Por defecto max-w-lg. */
  anchoMaximo?: string;
}

/**
 * Dialogo modal accesible: gestiona foco inicial, cierre con Escape y rol dialog.
 * El contenido del formulario se pasa como children.
 */
export function Modal({ abierto, titulo, alCerrar, children, anchoMaximo = "max-w-lg" }: PropsModal) {
  const refPanel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    refPanel.current?.focus();

    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") alCerrar();
    }
    document.addEventListener("keydown", alPresionarTecla);
    return () => document.removeEventListener("keydown", alPresionarTecla);
  }, [abierto, alCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) alCerrar();
      }}
    >
      <div
        ref={refPanel}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className={`w-full ${anchoMaximo} border border-borde bg-fondo shadow-xl outline-none`}
      >
        <div className="flex items-center justify-between border-b border-borde px-5 py-4">
          <h2 className="text-base font-semibold text-texto-fuerte">{titulo}</h2>
          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar"
            className="text-texto/60 hover:text-texto-fuerte"
          >
            <IconX className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

interface PropsConfirmacion {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  cargando?: boolean;
  alConfirmar: () => void;
  alCancelar: () => void;
}

/** Modal de confirmacion para acciones destructivas (eliminar). */
export function ModalConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = "Eliminar",
  cargando = false,
  alConfirmar,
  alCancelar,
}: PropsConfirmacion) {
  return (
    <Modal abierto={abierto} titulo={titulo} alCerrar={alCancelar} anchoMaximo="max-w-md">
      <p className="text-sm text-texto">{mensaje}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Boton variante="secundario" onClick={alCancelar} disabled={cargando}>
          Cancelar
        </Boton>
        <Boton variante="peligro" onClick={alConfirmar} cargando={cargando}>
          {textoConfirmar}
        </Boton>
      </div>
    </Modal>
  );
}
