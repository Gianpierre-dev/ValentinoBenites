import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cn } from "@/lib/utilidades";

/** Contenedor con scroll horizontal para tablas anchas en pantallas chicas. */
export function Tabla({ children, etiqueta }: { children: ReactNode; etiqueta: string }) {
  return (
    <div className="overflow-x-auto border border-borde">
      <table className="w-full border-collapse text-left text-sm" aria-label={etiqueta}>
        {children}
      </table>
    </div>
  );
}

export function EncabezadoTabla({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-borde bg-black/[.03] text-xs uppercase tracking-wide text-texto/70">
      {children}
    </thead>
  );
}

export function CuerpoTabla({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-borde">{children}</tbody>;
}

export function Th({ className, children, ...resto }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th scope="col" className={cn("px-4 py-3 font-medium", className)} {...resto}>
      {children}
    </th>
  );
}

export function Td({ className, children, ...resto }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("px-4 py-3 align-middle text-texto-fuerte", className)} {...resto}>
      {children}
    </td>
  );
}
