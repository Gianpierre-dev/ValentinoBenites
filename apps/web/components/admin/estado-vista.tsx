import type { ReactNode } from "react";
import { Spinner } from "@/components/ui";

/** Bloque centrado de carga para listados del panel. */
export function VistaCargando({ etiqueta = "Cargando" }: { etiqueta?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 border border-borde py-16 text-sm text-texto/70">
      <Spinner etiqueta={etiqueta} />
      <span>{etiqueta}...</span>
    </div>
  );
}

/** Bloque de error con accion de reintento. */
export function VistaError({ mensaje, alReintentar }: { mensaje: string; alReintentar: () => void }) {
  return (
    <div role="alert" className="border border-oferta bg-oferta/[.04] p-6 text-center">
      <p className="text-sm text-texto-fuerte">{mensaje}</p>
      <button
        type="button"
        onClick={alReintentar}
        className="mt-3 text-sm font-medium text-acento underline underline-offset-4"
      >
        Reintentar
      </button>
    </div>
  );
}

/** Estado vacio para listados sin registros. */
export function VistaVacia({ children }: { children: ReactNode }) {
  return (
    <div className="border border-dashed border-borde py-16 text-center text-sm text-texto/70">
      {children}
    </div>
  );
}
