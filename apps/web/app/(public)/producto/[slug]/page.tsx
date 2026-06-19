import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Etiqueta } from "@/components/ui";
import { AccionesProducto, GaleriaProducto } from "@/components/tienda";
import { ErrorApi, obtenerProducto } from "@/lib/api";
import type { Producto } from "@/lib/tipos";
import { calcularDescuento, formatearPrecio } from "@/lib/utilidades";

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
    description: producto.descripcion ?? `Compra ${producto.nombre} en Fabiola.`,
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label="Ruta de navegacion" className="mb-8 text-sm text-texto">
        <Link href="/catalogo" className="transition-colors hover:text-acento">
          Catalogo
        </Link>
        {producto.categoria && (
          <>
            <span aria-hidden className="mx-2">
              /
            </span>
            <Link
              href={`/catalogo?categoria=${producto.categoria.slug}`}
              className="transition-colors hover:text-acento"
            >
              {producto.categoria.nombre}
            </Link>
          </>
        )}
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <GaleriaProducto imagenes={producto.imagenes} nombre={producto.nombre} />

        <div className="flex flex-col gap-6">
          <div>
            {producto.categoria && (
              <p className="text-xs uppercase tracking-[0.2em] text-texto">
                {producto.categoria.nombre}
              </p>
            )}
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-texto-fuerte">
              {producto.nombre}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {enOferta ? (
              <>
                <span className="text-2xl font-semibold text-texto-fuerte">
                  {formatearPrecio(producto.precioOferta as number)}
                </span>
                <span className="text-lg text-texto/60 line-through">
                  {formatearPrecio(producto.precio)}
                </span>
                {descuento !== null && (
                  <Etiqueta variante="oferta">-{descuento}%</Etiqueta>
                )}
              </>
            ) : (
              <span className="text-2xl font-semibold text-texto-fuerte">
                {formatearPrecio(producto.precio)}
              </span>
            )}
          </div>

          {producto.descripcion && (
            <p className="whitespace-pre-line text-texto">{producto.descripcion}</p>
          )}

          <AccionesProducto producto={producto} />
        </div>
      </div>
    </div>
  );
}
