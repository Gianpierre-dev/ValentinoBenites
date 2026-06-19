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
    <article className="group">
      <Link
        href={`/producto/${producto.slug}`}
        className="block focus-visible:outline-none"
        aria-label={producto.nombre}
      >
        <div className="relative aspect-[3/4] overflow-hidden border border-borde bg-black/[.02]">
          {imagen ? (
            <Image
              src={imagen}
              alt={producto.nombre}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs uppercase tracking-wide text-texto/50">
              Sin imagen
            </div>
          )}
          {descuento !== null && (
            <Etiqueta variante="oferta" className="absolute left-2 top-2">
              -{descuento}%
            </Etiqueta>
          )}
        </div>

        <div className="mt-3 space-y-1">
          <h3 className="text-sm text-texto-fuerte">{producto.nombre}</h3>
          <div className="flex items-baseline gap-2">
            {enOferta ? (
              <>
                <span className="text-sm font-semibold text-texto-fuerte">
                  {formatearPrecio(producto.precioOferta as number)}
                </span>
                <span className="text-xs text-texto/60 line-through">
                  {formatearPrecio(producto.precio)}
                </span>
              </>
            ) : (
              <span className="text-sm font-semibold text-texto-fuerte">
                {formatearPrecio(producto.precio)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
