import type { ReactNode } from "react";
import { cn } from "@/lib/utilidades";

interface PropsEyebrow {
  children: ReactNode;
  /** true = version para fondos oscuros/morados (texto y punto en blanco). */
  sobreOscuro?: boolean;
  className?: string;
}

/**
 * Micro-titulo editorial ("eyebrow"): pildora en mayusculas con tracking amplio
 * y un punto de acento. Marca el inicio de cada seccion y homologa la jerarquia
 * en todo el storefront. Usa `.titulo-ui` para conservar Inter (la serif no
 * funciona en textos pequenos en mayusculas).
 */
export function Eyebrow({ children, sobreOscuro = false, className }: PropsEyebrow) {
  return (
    <span
      className={cn(
        "titulo-ui inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em]",
        sobreOscuro
          ? "border-white/25 bg-white/10 text-white"
          : "border-borde bg-superficie text-acento",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          sobreOscuro ? "bg-white/70" : "bg-acento-claro",
        )}
      />
      {children}
    </span>
  );
}
