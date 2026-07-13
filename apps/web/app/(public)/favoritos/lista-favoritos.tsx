"use client";

import Image from "next/image";
import Link from "next/link";
import { IconBrandWhatsapp, IconHeart, IconHeartFilled } from "@tabler/icons-react";
import { Boton, Spinner } from "@/components/ui";
import { useFavoritos } from "@/store/favoritos";
import { useHidratadoFavoritos } from "@/store/usar-hidratado";
import { construirEnlaceWhatsApp, construirMensajeFavoritos } from "@/lib/checkout";
import { formatearPrecio } from "@/lib/utilidades";

interface PropsListaFavoritos {
  /** Numero de WhatsApp del negocio (de Configuracion); null si no esta configurado. */
  numeroWhatsapp: string | null;
}

/**
 * Favoritos de la clienta: grilla de productos marcados con el corazon, con
 * acceso al detalle y opcion de quitar. Los datos salen del snapshot guardado
 * en localStorage, por eso el precio es referencial (el vigente esta en el
 * detalle del producto). Incluye "Consultar por WhatsApp": envia la lista como
 * consulta (no como pedido) para abrir la conversacion de venta; la lista queda
 * ademas persistida en el chat.
 */
export function ListaFavoritos({ numeroWhatsapp }: PropsListaFavoritos) {
  const hidratado = useHidratadoFavoritos();
  const items = useFavoritos((estado) => estado.items);
  const quitar = useFavoritos((estado) => estado.quitar);

  const consultarPorWhatsApp = () => {
    // El origen se resuelve al click para no depender del dominio configurado.
    const mensaje = construirMensajeFavoritos(items, window.location.origin);
    const enlace = construirEnlaceWhatsApp(numeroWhatsapp, mensaje);
    if (enlace) window.open(enlace, "_blank", "noopener,noreferrer");
  };

  if (!hidratado) {
    return (
      <div className="mx-auto flex max-w-7xl justify-center px-4 py-24 sm:px-6 lg:px-8">
        <Spinner tamano="lg" etiqueta="Cargando favoritos" />
      </div>
    );
  }

  if (items.length === 0) {
    return <FavoritosVacio />;
  }

  return (
    <div className="bg-gradient-to-b from-rosa-fuerte to-fondo">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-texto-fuerte sm:text-4xl">
              Tus favoritos
            </h1>
            <span className="text-sm text-texto">
              {items.length} {items.length === 1 ? "producto" : "productos"}
            </span>
          </div>
          {numeroWhatsapp && (
            <button
              type="button"
              onClick={consultarPorWhatsApp}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-medium text-white transition-all duration-300 ease-suave hover:bg-[#1fb857] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:transition-none sm:h-10"
            >
              <IconBrandWhatsapp size={20} aria-hidden />
              Consultar por WhatsApp
            </button>
          )}
        </header>

        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {items.map((item) => {
            const enOferta =
              item.precioOferta !== null && item.precioOferta < item.precio;

            return (
              <li key={item.productoId} className="group relative">
                <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-borde bg-fondo shadow-[0_1px_3px_rgba(17,17,17,0.04)] transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:border-acento/30 group-hover:shadow-[0_18px_40px_-12px_rgba(125,33,129,0.28)]">
                  <div className="relative aspect-[3/4] overflow-hidden bg-perla">
                    {item.imagenUrl ? (
                      <Image
                        src={item.imagenUrl}
                        alt={item.nombre}
                        fill
                        sizes="(min-width: 1024px) 25vw, 50vw"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs uppercase tracking-wide text-texto/50">
                        Sin imagen
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => quitar(item.productoId)}
                      aria-label={`Quitar ${item.nombre} de favoritos`}
                      className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-fondo/90 text-acento shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-110 motion-reduce:transition-none"
                    >
                      <IconHeartFilled size={20} aria-hidden />
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col gap-1.5 p-4">
                    <h2 className="text-sm font-medium leading-snug text-texto-fuerte">
                      {item.nombre}
                    </h2>
                    <div className="mt-auto flex items-baseline gap-2 pt-1">
                      {enOferta ? (
                        <>
                          <span className="text-base font-semibold text-acento">
                            {formatearPrecio(item.precioOferta as number)}
                          </span>
                          <span className="text-xs text-texto/60 line-through">
                            {formatearPrecio(item.precio)}
                          </span>
                        </>
                      ) : (
                        <span className="text-base font-semibold text-texto-fuerte">
                          {formatearPrecio(item.precio)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Link
                  href={`/producto/${item.slug}`}
                  aria-label={item.nombre}
                  className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento focus-visible:ring-offset-2"
                >
                  <span className="sr-only">{item.nombre}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function FavoritosVacio() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <IconHeart size={48} stroke={1.25} aria-hidden className="text-texto/40" />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-texto-fuerte">
        Todavía no tienes favoritos
      </h1>
      <p className="mt-2 text-texto">
        Toca el corazón de un producto para guardarlo aquí.
      </p>
      <Link href="/catalogo" className="mt-6">
        <Boton tamano="lg">Ver catálogo</Boton>
      </Link>
    </div>
  );
}
