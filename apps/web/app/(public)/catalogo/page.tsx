import { Suspense } from "react";
import type { Metadata } from "next";
import { Buscador, FiltroCategorias, GrillaProductos } from "@/components/tienda";
import { listarCategorias, listarProductos } from "@/lib/api";
import type { Categoria, Producto } from "@/lib/tipos";

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
  const { categoria, q } = await searchParams;
  const categoriaSlug = typeof categoria === "string" ? categoria : undefined;
  const consulta = typeof q === "string" ? q : undefined;

  const [categorias, productos] = await Promise.all([
    cargarCategorias(),
    cargarProductos(categoriaSlug, consulta),
  ]);

  return (
    <div className="bg-rosa">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-6">
          <h1 className="text-3xl font-semibold tracking-tight text-texto-fuerte">
            Catalogo
          </h1>
          <Suspense fallback={null}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <FiltroCategorias
                categorias={categorias}
                categoriaActiva={categoriaSlug}
              />
              <Buscador />
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

async function cargarProductos(
  categoria: string | undefined,
  q: string | undefined,
): Promise<Producto[]> {
  try {
    return await listarProductos({ categoria, q });
  } catch {
    return [];
  }
}
