"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Etiqueta } from "@/components/ui";
import type { Producto } from "@/lib/tipos";
import { calcularDescuento, formatearPrecio } from "@/lib/utilidades";
import { ControlCarritoTarjeta } from "./control-carrito-tarjeta";
import { BotonFavorito } from "./boton-favorito";
import { BolitasColor } from "./bolitas-color";

interface PropsTarjetaProducto {
  producto: Producto;
}

/**
 * Tarjeta de producto del catalogo: foto protagonista, nombre, bolitas de color
 * y precio (tachado + badge si hay oferta). Elegir una bolita previsualiza la
 * foto de esa variante y define que color agrega el boton rapido. Usa el patron
 * "stretched link": un enlace superpuesto cubre toda la tarjeta para navegar al
 * detalle, y las acciones (bolitas, favorito, agregar) se elevan por encima.
 */
export function TarjetaProducto({ producto }: PropsTarjetaProducto) {
  const variantes = producto.variantes ?? [];
  const [varianteId, setVarianteId] = useState<string | null>(
    variantes[0]?.id ?? null,
  );
  const seleccionada =
    variantes.find((variante) => variante.id === varianteId) ?? variantes[0];

  const imagen =
    seleccionada?.imagenesEfectivas?.[0]?.url ??
    producto.imagenes?.[0]?.url ??
    null;
  const enOferta = producto.precioOferta !== null && producto.precioOferta < producto.precio;
  const descuento = calcularDescuento(producto.precio, producto.precioOferta);

  return (
    <article className="group relative h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-borde bg-superficie shadow-[0_2px_6px_-2px_rgba(17,17,17,0.08),0_12px_28px_-16px_rgba(125,33,129,0.22)] transition-[transform,box-shadow,border-color] duration-500 ease-suave group-hover:-translate-y-1.5 group-hover:border-acento/30 group-hover:shadow-[0_30px_54px_-22px_rgba(125,33,129,0.34)]">
        <div className="relative aspect-[3/4] overflow-hidden bg-perla">
          {imagen ? (
            <Image
              src={imagen}
              alt={producto.nombre}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 ease-suave group-hover:scale-[1.06]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs uppercase tracking-wide text-texto/50">
              Sin imagen
            </div>
          )}
          {descuento !== null && (
            <Etiqueta
              variante="oferta"
              className="absolute left-3 top-3 rounded-full px-2.5 py-1 shadow-sm"
            >
              -{descuento}%
            </Etiqueta>
          )}
          <BotonFavorito
            producto={producto}
            className="absolute right-3 top-3 z-20 bg-fondo/90 shadow-sm backdrop-blur-sm"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-4">
          {producto.categoria && (
            <p className="titulo-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-acento/80">
              {producto.categoria.nombre}
            </p>
          )}
          <h3 className="text-sm font-medium leading-snug text-texto-fuerte">
            {producto.nombre}
          </h3>
          {variantes.length > 1 && (
            <BolitasColor
              variantes={variantes}
              varianteSeleccionadaId={seleccionada?.id ?? null}
              alSeleccionar={(variante) => setVarianteId(variante.id)}
              className="mt-0.5"
            />
          )}
          <div className="mt-auto flex items-baseline gap-2 pt-1.5">
            {enOferta ? (
              <>
                <span className="font-display text-xl font-semibold text-acento">
                  {formatearPrecio(producto.precioOferta as number)}
                </span>
                <span className="text-xs text-texto/60 line-through">
                  {formatearPrecio(producto.precio)}
                </span>
              </>
            ) : (
              <span className="font-display text-xl font-semibold text-acento">
                {formatearPrecio(producto.precio)}
              </span>
            )}
          </div>
          <ControlCarritoTarjeta producto={producto} />
        </div>
      </div>

      <Link
        href={`/producto/${producto.slug}`}
        aria-label={producto.nombre}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento focus-visible:ring-offset-2"
      >
        <span className="sr-only">{producto.nombre}</span>
      </Link>
    </article>
  );
}
