import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utilidades";

type VarianteBoton = "primario" | "secundario" | "fantasma" | "peligro";
type TamanoBoton = "sm" | "md" | "lg";

interface PropsBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  cargando?: boolean;
}

const VARIANTES: Record<VarianteBoton, string> = {
  primario:
    "bg-acento text-acento-contraste hover:opacity-90 disabled:opacity-50",
  secundario:
    "border border-borde bg-fondo text-texto-fuerte hover:bg-black/[.04] disabled:opacity-50",
  fantasma: "text-texto hover:bg-black/[.04] disabled:opacity-50",
  peligro: "bg-oferta text-white hover:opacity-90 disabled:opacity-50",
};

const TAMANOS: Record<TamanoBoton, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Boton = forwardRef<HTMLButtonElement, PropsBoton>(function Boton(
  { variante = "primario", tamano = "md", cargando = false, className, children, disabled, ...resto },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || cargando}
      aria-busy={cargando}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-none font-medium tracking-wide transition-colors disabled:cursor-not-allowed",
        VARIANTES[variante],
        TAMANOS[tamano],
        className,
      )}
      {...resto}
    >
      {cargando && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
});
