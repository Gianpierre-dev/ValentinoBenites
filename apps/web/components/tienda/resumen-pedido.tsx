"use client";

import Image from "next/image";
import { IconShoppingBag } from "@tabler/icons-react";
import type { LineaCarrito } from "@/store/carrito";
import { formatearPrecio } from "@/lib/utilidades";

interface PropsResumenPedido {
  lineas: LineaCarrito[];
  total: number;
}

/**
 * Resumen del pedido para el checkout: card con profundidad que lista cada
 * producto con su foto miniatura, cantidad y subtotal de linea, mas el total
 * destacado. Solo lectura (la edicion de cantidades vive en el carrito).
 */
export function ResumenPedido({ lineas, total }: PropsResumenPedido) {
  const unidades = lineas.reduce((suma, linea) => suma + linea.cantidad, 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-borde bg-fondo shadow-[0_1px_3px_rgba(17,17,17,0.04)]">
      <div className="flex items-center justify-between gap-3 border-b border-borde bg-perla px-6 py-4">
        <h2 className="titulo-ui text-sm font-semibold uppercase tracking-wide text-texto-fuerte">
          Tu pedido
        </h2>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-texto">
          <IconShoppingBag size={15} aria-hidden />
          {unidades} {unidades === 1 ? "artículo" : "artículos"}
        </span>
      </div>

      <ul className="divide-y divide-borde px-6">
        {lineas.map((linea) => (
          <li key={linea.productoId} className="flex gap-4 py-4">
            <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-borde bg-perla">
              {linea.imagenUrl ? (
                <Image
                  src={linea.imagenUrl}
                  alt={linea.nombre}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] uppercase text-texto/50">
                  Sin foto
                </div>
              )}
              <span
                aria-hidden
                className="absolute -right-2 -top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-acento px-1.5 text-xs font-semibold text-acento-contraste shadow-sm"
              >
                {linea.cantidad}
              </span>
            </div>

            <div className="flex flex-1 flex-col justify-center gap-1">
              <p className="text-sm font-medium leading-snug text-texto-fuerte">
                {linea.nombre}
              </p>
              <p className="text-xs text-texto">
                {linea.cantidad} × {formatearPrecio(linea.precioUnitario)}
              </p>
            </div>

            <span className="self-center text-sm font-semibold text-texto-fuerte">
              {formatearPrecio(linea.precioUnitario * linea.cantidad)}
            </span>
          </li>
        ))}
      </ul>

      <div className="space-y-3 border-t border-borde px-6 py-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-texto">Subtotal</span>
          <span className="font-medium text-texto-fuerte">
            {formatearPrecio(total)}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-borde pt-3">
          <span className="text-sm font-semibold uppercase tracking-wide text-texto-fuerte">
            Total
          </span>
          <span className="font-display text-2xl font-semibold text-acento">
            {formatearPrecio(total)}
          </span>
        </div>
        <p className="text-xs text-texto">
          El monto final se confirma al validar tu pedido.
        </p>
      </div>
    </div>
  );
}
