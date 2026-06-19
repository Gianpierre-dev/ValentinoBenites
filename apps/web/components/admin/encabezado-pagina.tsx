import type { ReactNode } from "react";

interface PropsEncabezadoPagina {
  titulo: string;
  descripcion?: string;
  /** Acciones a la derecha del titulo (ej. boton "Nuevo"). */
  acciones?: ReactNode;
}

/** Cabecera estandar de cada vista del panel: titulo, descripcion y acciones. */
export function EncabezadoPagina({ titulo, descripcion, acciones }: PropsEncabezadoPagina) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-texto-fuerte">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-texto/70">{descripcion}</p>}
      </div>
      {acciones && <div className="flex items-center gap-2">{acciones}</div>}
    </div>
  );
}
