import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utilidades";

type VarianteEtiqueta =
  | "neutral"
  | "acento"
  | "activo"
  | "oferta"
  | "exito"
  | "advertencia";

interface PropsEtiqueta extends HTMLAttributes<HTMLSpanElement> {
  variante?: VarianteEtiqueta;
}

/*
  Estados armonizados con la identidad de marca:
  - neutral: gris suave (estados apagados / "Inactivo").
  - acento: morado solido, maxima jerarquia de marca ("Destacado").
  - activo: morado suave (tint), estado ON de marca SIN verde gratuito.
  - oferta: rojo de marca solido (descuento storefront / pedido "Rechazado").
  - exito / advertencia: semantica de pedido en tonos APAGADOS (no Tailwind
    crudo chillon) para conservar significado sin romper la sobriedad.
*/
const VARIANTES: Record<VarianteEtiqueta, string> = {
  neutral: "bg-black/[.06] text-texto",
  acento: "bg-acento text-acento-contraste",
  activo: "bg-acento/10 text-acento",
  oferta: "bg-oferta text-white",
  exito: "bg-emerald-50 text-emerald-700",
  advertencia: "bg-amber-50 text-amber-700",
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
