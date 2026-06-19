import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utilidades";

type VarianteEtiqueta = "neutral" | "acento" | "oferta" | "exito" | "advertencia";

interface PropsEtiqueta extends HTMLAttributes<HTMLSpanElement> {
  variante?: VarianteEtiqueta;
}

const VARIANTES: Record<VarianteEtiqueta, string> = {
  neutral: "bg-black/[.06] text-texto",
  acento: "bg-acento text-acento-contraste",
  oferta: "bg-oferta text-white",
  exito: "bg-green-600 text-white",
  advertencia: "bg-amber-500 text-black",
};

/** Badge para descuentos, estados de pedido, destacados, etc. */
export function Etiqueta({ variante = "neutral", className, children, ...resto }: PropsEtiqueta) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
        VARIANTES[variante],
        className,
      )}
      {...resto}
    >
      {children}
    </span>
  );
}
