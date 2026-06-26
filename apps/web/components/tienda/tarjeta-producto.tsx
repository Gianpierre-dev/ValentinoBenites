import Image from "next/image";
import Link from "next/link";
import { Etiqueta } from "@/components/ui";
import type { Producto } from "@/lib/tipos";
import { calcularDescuento, formatearPrecio } from "@/lib/utilidades";

interface PropsTarjetaProducto {
  producto: Producto;
}

/**
 * Tarjeta de producto del catalogo: foto protagonista, nombre, precio y, si hay
 * oferta, precio tachado + badge de descuento. Toda la tarjeta enlaza al detalle.
 */
export function TarjetaProducto({ producto }: PropsTarjetaProducto) {
  const imagen = producto.imagenes?.[0]?.url ?? null;
  const enOferta = producto.precioOferta !== null && producto.precioOferta < producto.precio;
  const descuento = calcularDescuento(producto.precio, producto.precioOferta);

  return (
    <article className="group h-full">
      <Link
        href={`/producto/${producto.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-borde bg-fondo shadow-[0_1px_3px_rgba(17,17,17,0.04)] transition-all duration-300 ease-out focus-visible:outline-none group-hover:-translate-y-1 group-hover:border-acento/30 group-hover:shadow-[0_18px_40px_-12px_rgba(125,33,129,0.28)]"
        aria-label={producto.nombre}
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-perla">
          {imagen ? (
            <Image
              src={imagen}
              alt={producto.nombre}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
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
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <h3 className="text-sm font-medium leading-snug text-texto-fuerte">
            {producto.nombre}
          </h3>
          <div className="mt-auto flex items-baseline gap-2 pt-1">
            {enOferta ? (
              <>
                <span className="text-base font-semibold text-acento">
                  {formatearPrecio(producto.precioOferta as number)}
                </span>
                <span className="text-xs text-texto/60 line-through">
                  {formatearPrecio(producto.precio)}
                </span>
              </>
            ) : (
              <span className="text-base font-semibold text-texto-fuerte">
                {formatearPrecio(producto.precio)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
