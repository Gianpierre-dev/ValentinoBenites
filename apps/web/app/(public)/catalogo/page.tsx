import { Suspense } from "react";
import type { Metadata } from "next";
import {
  Buscador,
  FiltroCategorias,
  FiltroPrecio,
  GrillaProductos,
} from "@/components/tienda";
import { listarCategorias, listarProductos } from "@/lib/api";
import type { Categoria, FiltrosProductos, Producto } from "@/lib/tipos";

export const metadata: Metadata = {
  title: "Catalogo",
  description:
    "Explora todos los productos de Valentino Benites: carteras, calzado y accesorios.",
};

/**
 * Catalogo del storefront: busqueda por texto y filtro por categoria via query
 * params (?categoria=slug&q=texto). Server component que carga los datos filtrados.
 */
export default async function PaginaCatalogo({
  searchParams,
}: PageProps<"/catalogo">) {
  const { categoria, q, precioMin, precioMax } = await searchParams;
  const categoriaSlug = typeof categoria === "string" ? categoria : undefined;
  const consulta = typeof q === "string" ? q : undefined;

  const filtros: FiltrosProductos = {
    categoria: categoriaSlug,
    q: consulta,
    precioMin: aNumero(precioMin),
    precioMax: aNumero(precioMax),
  };

  const [categorias, productos] = await Promise.all([
    cargarCategorias(),
    cargarProductos(filtros),
  ]);

  return (
    <div className="bg-rosa">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-6">
          <h1 className="text-3xl font-semibold tracking-tight text-texto-fuerte">
            Catalogo
          </h1>
          <Suspense fallback={null}>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <FiltroCategorias
                  categorias={categorias}
                  categoriaActiva={categoriaSlug}
                />
                <Buscador />
              </div>
              <FiltroPrecio />
            </div>
          </Suspense>
        </header>

        <div className="mt-10">
          {consulta && (
            <p className="mb-6 text-sm text-texto">
              Resultados para{" "}
              <span className="font-medium text-texto-fuerte">{consulta}</span>
            </p>
          )}
          <GrillaProductos
            productos={productos}
            mensajeVacio="No encontramos productos con esos criterios."
          />
        </div>
      </div>
    </div>
  );
}

async function cargarCategorias(): Promise<Categoria[]> {
  try {
    return await listarCategorias();
  } catch {
    return [];
  }
}

async function cargarProductos(filtros: FiltrosProductos): Promise<Producto[]> {
  try {
    return await listarProductos(filtros);
  } catch {
    return [];
  }
}

/** Convierte un searchParam en número válido (> 0) o undefined. */
function aNumero(valor: string | string[] | undefined): number | undefined {
  if (typeof valor !== "string") return undefined;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero : undefined;
}
