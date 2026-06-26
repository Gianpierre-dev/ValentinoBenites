import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utilidades";

type PropsTarjeta = HTMLAttributes<HTMLDivElement>;

/**
 * Contenedor base de marca: borde sutil, fondo blanco, radio rounded-2xl y una
 * sombra apenas perceptible. Homologa el lenguaje de las cards del storefront
 * para que admin y tienda compartan el mismo contenedor.
 */
export function Tarjeta({ className, children, ...resto }: PropsTarjeta) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-borde bg-fondo shadow-[0_1px_3px_rgba(17,17,17,0.04)]",
        className,
      )}
      {...resto}
    >
      {children}
    </div>
  );
}

export function TarjetaContenido({ className, children, ...resto }: PropsTarjeta) {
  return (
    <div className={cn("p-4", className)} {...resto}>
      {children}
    </div>
  );
}
