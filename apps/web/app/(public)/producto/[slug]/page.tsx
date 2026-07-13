import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconChevronRight } from "@tabler/icons-react";
import { Eyebrow, Revelar } from "@/components/ui";
import { CompradorProducto, GrillaProductos } from "@/components/tienda";
import { ErrorApi, listarProductos, obtenerProducto } from "@/lib/api";
import type { Producto } from "@/lib/tipos";

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

  const relacionados = await cargarRelacionados(producto);

  return (
    <>
      <div className="bg-gradient-to-b from-perla to-fondo">
        <div className="mx-auto max-w-7xl px-4 py-10 pb-24 sm:px-6 sm:pb-10 lg:py-14 lg:px-8 lg:pb-14">
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

          <CompradorProducto producto={producto} />
        </div>
      </div>

      {relacionados.length > 0 && (
        <section
          aria-labelledby="titulo-relacionados"
          className="border-t border-borde bg-perla"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <Revelar>
              <Eyebrow>Sigue explorando</Eyebrow>
              <h2
                id="titulo-relacionados"
                className="mt-5 text-3xl font-normal sm:text-4xl lg:text-5xl"
              >
                También te puede{" "}
                <span className="italic text-acento">gustar</span>
              </h2>
              <p className="mt-4 max-w-md text-texto">
                Otras piezas destacadas que combinan con tu estilo.
              </p>
            </Revelar>
            <Revelar delay={80} className="mt-10">
              <GrillaProductos productos={relacionados} />
            </Revelar>
          </div>
        </section>
      )}
    </>
  );
}
