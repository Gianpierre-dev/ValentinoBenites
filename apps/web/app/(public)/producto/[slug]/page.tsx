import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconChevronRight } from "@tabler/icons-react";
import { Etiqueta } from "@/components/ui";
import {
  AccionesProducto,
  GaleriaProducto,
  GrillaProductos,
} from "@/components/tienda";
import { ErrorApi, listarProductos, obtenerProducto } from "@/lib/api";
import type { Producto } from "@/lib/tipos";
import { calcularDescuento, formatearPrecio } from "@/lib/utilidades";

const MAX_RELACIONADOS = 4;

async function cargarRelacionados(actual: Producto): Promise<Producto[]> {
  try {
    const candidatos = await listarProductos({ destacados: true });
    return candidatos
      .filter((producto) => producto.id !== actual.id)
      .slice(0, MAX_RELACIONADOS);
  } catch {
    return [];
  }
}

interface ResultadoCarga {
  producto: Producto | null;
}

async function cargarProducto(slug: string): Promise<ResultadoCarga> {
  try {
    return { producto: await obtenerProducto(slug) };
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 404) {
      return { producto: null };
    }
    throw error;
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/producto/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { producto } = await cargarProducto(slug);

  if (!producto) return { title: "Producto no encontrado" };

  return {
    title: producto.nombre,
    description:
      producto.descripcion ?? `Compra ${producto.nombre} en Valentino Benites.`,
  };
}

/**
 * Detalle de producto: galeria, precio (con oferta tachada si aplica), descripcion
 * y acciones de compra. Devuelve 404 si el producto no existe.
 */
export default async function PaginaProducto({
  params,
}: PageProps<"/producto/[slug]">) {
  const { slug } = await params;
  const { producto } = await cargarProducto(slug);

  if (!producto) notFound();

  const enOferta =
    producto.precioOferta !== null && producto.precioOferta < producto.precio;
  const descuento = calcularDescuento(producto.precio, producto.precioOferta);
  const relacionados = await cargarRelacionados(producto);

  return (
    <>
      <div className="bg-gradient-to-b from-perla to-fondo">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14 lg:px-8">
          <nav
            aria-label="Ruta de navegación"
            className="mb-8 flex items-center gap-1.5 text-sm text-texto"
          >
            <Link href="/catalogo" className="transition-colors hover:text-acento">
              Catálogo
            </Link>
            {producto.categoria && (
              <>
                <IconChevronRight size={14} aria-hidden className="text-texto/40" />
                <Link
                  href={`/catalogo?categoria=${producto.categoria.slug}`}
                  className="transition-colors hover:text-acento"
                >
                  {producto.categoria.nombre}
                </Link>
              </>
            )}
            <IconChevronRight size={14} aria-hidden className="text-texto/40" />
            <span className="truncate text-texto-fuerte">{producto.nombre}</span>
          </nav>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
            <GaleriaProducto
              imagenes={producto.imagenes}
              nombre={producto.nombre}
            />

            <div className="flex flex-col gap-7 lg:pt-4">
              <div>
                {producto.categoria && (
                  <p className="titulo-ui text-xs font-semibold uppercase tracking-[0.2em] text-acento">
                    {producto.categoria.nombre}
                  </p>
                )}
                <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-texto-fuerte sm:text-5xl">
                  {producto.nombre}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {enOferta ? (
                  <>
                    <span className="font-display text-3xl font-semibold text-acento">
                      {formatearPrecio(producto.precioOferta as number)}
                    </span>
                    <span className="text-xl text-texto/50 line-through">
                      {formatearPrecio(producto.precio)}
                    </span>
                    {descuento !== null && (
                      <Etiqueta variante="oferta">-{descuento}%</Etiqueta>
                    )}
                  </>
                ) : (
                  <span className="font-display text-3xl font-semibold text-texto-fuerte">
                    {formatearPrecio(producto.precio)}
                  </span>
                )}
              </div>

              <AccionesProducto producto={producto} />

              {producto.descripcion && (
                <section
                  aria-label="Descripción del producto"
                  className="rounded-2xl border border-borde bg-fondo p-6 shadow-[0_1px_3px_rgba(17,17,17,0.04)]"
                >
                  <h2 className="titulo-ui text-sm font-semibold uppercase tracking-wide text-texto-fuerte">
                    Descripción
                  </h2>
                  <p className="mt-3 whitespace-pre-line leading-relaxed text-texto">
                    {producto.descripcion}
                  </p>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section
          aria-labelledby="titulo-relacionados"
          className="border-t border-borde bg-perla"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2
              id="titulo-relacionados"
              className="text-3xl font-extrabold sm:text-4xl"
            >
              También te puede gustar
            </h2>
            <p className="mt-3 max-w-md text-texto">
              Otras piezas destacadas que combinan con tu estilo.
            </p>
            <div className="mt-10">
              <GrillaProductos productos={relacionados} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
