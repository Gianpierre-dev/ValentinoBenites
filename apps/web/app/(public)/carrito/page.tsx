"use client";

import Image from "next/image";
import Link from "next/link";
import { IconTrash, IconShoppingBag } from "@tabler/icons-react";
import { Boton, Spinner } from "@/components/ui";
import { SelectorCantidad } from "@/components/tienda";
import { useCarrito } from "@/store/carrito";
import { useHidratado } from "@/store/usar-hidratado";
import { formatearPrecio } from "@/lib/utilidades";

/**
 * Carrito de compras: lista de items con edicion de cantidad, eliminacion,
 * total referencial y acceso al checkout. Lee el store persistido en el cliente.
 */
export default function PaginaCarrito() {
  const hidratado = useHidratado();
  const lineas = useCarrito((estado) => estado.lineas);
  const cambiarCantidad = useCarrito((estado) => estado.cambiarCantidad);
  const quitar = useCarrito((estado) => estado.quitar);
  const total = useCarrito((estado) => estado.total());

  if (!hidratado) {
    return (
      <div className="mx-auto flex max-w-7xl justify-center px-4 py-24 sm:px-6 lg:px-8">
        <Spinner tamano="lg" etiqueta="Cargando carrito" />
      </div>
    );
  }

  if (lineas.length === 0) {
    return <CarritoVacio />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-texto-fuerte">
        Tu carrito
      </h1>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <ul className="divide-y divide-borde border-y border-borde lg:col-span-2">
          {lineas.map((linea) => (
            <li key={linea.productoId} className="flex gap-4 py-6">
              <div className="relative h-28 w-24 shrink-0 overflow-hidden border border-borde bg-black/[.02]">
                {linea.imagenUrl ? (
                  <Image
                    src={linea.imagenUrl}
                    alt={linea.nombre}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] uppercase text-texto/50">
                    Sin foto
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-4">
                  <Link
                    href={`/producto/${linea.slug}`}
                    className="text-sm text-texto-fuerte transition-colors hover:text-acento"
                  >
                    {linea.nombre}
                  </Link>
                  <button
                    type="button"
                    onClick={() => quitar(linea.productoId)}
                    aria-label={`Quitar ${linea.nombre} del carrito`}
                    className="text-texto/60 transition-colors hover:text-oferta"
                  >
                    <IconTrash size={18} aria-hidden />
                  </button>
                </div>

                <div className="flex items-end justify-between gap-4">
                  <SelectorCantidad
                    cantidad={linea.cantidad}
                    alCambiar={(cantidad) =>
                      cambiarCantidad(linea.productoId, cantidad)
                    }
                    maximo={linea.stock}
                  />
                  <span className="text-sm font-semibold text-texto-fuerte">
                    {formatearPrecio(linea.precioUnitario * linea.cantidad)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit border border-borde p-6">
          <h2 className="titulo-ui text-sm font-semibold uppercase tracking-wide text-texto-fuerte">
            Resumen
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-texto">Subtotal</dt>
              <dd className="font-medium text-texto-fuerte">
                {formatearPrecio(total)}
              </dd>
            </div>
          </dl>
          <div className="mt-6 flex items-center justify-between border-t border-borde pt-4">
            <span className="text-sm font-semibold uppercase tracking-wide text-texto-fuerte">
              Total
            </span>
            <span className="text-lg font-semibold text-texto-fuerte">
              {formatearPrecio(total)}
            </span>
          </div>
          <Link href="/checkout" className="mt-6 block">
            <Boton tamano="lg" className="w-full">
              Continuar al pago
            </Boton>
          </Link>
          <Link href="/catalogo" className="mt-3 block">
            <Boton variante="secundario" tamano="md" className="w-full">
              Seguir comprando
            </Boton>
          </Link>
        </aside>
      </div>
    </div>
  );
}

function CarritoVacio() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <IconShoppingBag size={48} stroke={1.25} aria-hidden className="text-texto/40" />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-texto-fuerte">
        Tu carrito esta vacio
      </h1>
      <p className="mt-2 text-texto">
        Agrega productos desde el catalogo para continuar.
      </p>
      <Link href="/catalogo" className="mt-6">
        <Boton tamano="lg">Ver catalogo</Boton>
      </Link>
    </div>
  );
}
