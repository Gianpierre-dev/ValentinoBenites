import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utilidades";

type PropsTarjeta = HTMLAttributes<HTMLDivElement>;

/** Contenedor base con borde sutil y fondo blanco, acorde a la estetica minimalista. */
export function Tarjeta({ className, children, ...resto }: PropsTarjeta) {
  return (
    <div className={cn("border border-borde bg-fondo", className)} {...resto}>
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
