import Link from "next/link";
import { Boton } from "@/components/ui";
import { GrillaProductos, Newsletter } from "@/components/tienda";
import { listarCategorias, listarProductos } from "@/lib/api";
import type { Categoria, Producto } from "@/lib/tipos";

/**
 * Home del storefront estilo paez: hero/banner, atajos por categoria y grilla de
 * productos destacados. Server component; degrada sin romper si la API no responde.
 */
export default async function PaginaInicio() {
  const [destacados, categorias] = await Promise.all([
    cargarDestacados(),
    cargarCategorias(),
  ]);

  return (
    <>
      <Hero />
      {categorias.length > 0 && <AtajosCategorias categorias={categorias} />}
      <ProductosDestacados productos={destacados} />
      <Newsletter />
    </>
  );
}

async function cargarDestacados(): Promise<Producto[]> {
  try {
    return await listarProductos({ destacados: true });
  } catch {
    return [];
  }
}

async function cargarCategorias(): Promise<Categoria[]> {
  try {
    return await listarCategorias();
  } catch {
    return [];
  }
}

function Hero() {
  return (
    <section className="border-b border-borde">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <p className="text-xs uppercase tracking-[0.3em] text-texto">
          Nueva temporada
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-texto-fuerte sm:text-5xl">
          Moda y accesorios que te acompañan todos los dias
        </h1>
        <p className="max-w-md text-texto">
          Carteras, calzado y accesorios para mujer. Calidad y estilo en cada
          detalle, seleccionados para ti.
        </p>
        <Link href="/catalogo">
          <Boton tamano="lg">Ver catalogo</Boton>
        </Link>
      </div>
    </section>
  );
}

function AtajosCategorias({ categorias }: { categorias: Categoria[] }) {
  return (
    <section
      aria-labelledby="titulo-categorias"
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <h2
        id="titulo-categorias"
        className="text-sm font-semibold uppercase tracking-wide text-texto-fuerte"
      >
        Compra por categoria
      </h2>
      <ul className="mt-6 flex flex-wrap gap-3">
        {categorias.map((categoria) => (
          <li key={categoria.id}>
            <Link
              href={`/catalogo?categoria=${categoria.slug}`}
              className="inline-flex border border-borde px-5 py-3 text-sm uppercase tracking-wide text-texto transition-colors hover:border-acento hover:text-acento"
            >
              {categoria.nombre}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProductosDestacados({ productos }: { productos: Producto[] }) {
  return (
    <section
      aria-labelledby="titulo-destacados"
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="flex items-end justify-between">
        <h2
          id="titulo-destacados"
          className="text-2xl font-semibold tracking-tight text-texto-fuerte"
        >
          Destacados
        </h2>
        <Link
          href="/catalogo"
          className="text-sm uppercase tracking-wide text-texto transition-colors hover:text-acento"
        >
          Ver todo
        </Link>
      </div>
      <div className="mt-8">
        <GrillaProductos
          productos={productos}
          mensajeVacio="Pronto tendremos productos destacados."
        />
      </div>
    </section>
  );
}
