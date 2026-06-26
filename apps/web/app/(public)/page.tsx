import Image from "next/image";
import Link from "next/link";
import {
  IconArrowRight,
  IconAward,
  IconShieldLock,
  IconTruckDelivery,
} from "@tabler/icons-react";
import { GrillaProductos, Newsletter } from "@/components/tienda";
import { listarCategorias, listarProductos } from "@/lib/api";
import type { Categoria, Producto } from "@/lib/tipos";

/**
 * Home del storefront Valentino Benites: hero con producto protagonista, atajos
 * por categoria, prueba de confianza, grilla de destacados y newsletter.
 * Server component; degrada sin romper si la API no responde.
 */
export default async function PaginaInicio() {
  const [destacados, categorias] = await Promise.all([
    cargarDestacados(),
    cargarCategorias(),
  ]);

  return (
    <>
      <Hero />
      <Beneficios />
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

// Foto real de producto Valentino Benites (catálogo en public/productos).
const IMAGEN_HERO = "/productos/foto-40.jpg";

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-borde bg-gradient-to-br from-white via-perla to-[#f3e8f6]">
      {/* Dots decorativos en magenta para dar vida sin recargar. */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-[8%] top-16 h-2.5 w-2.5 rounded-full bg-acento-claro/70"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-[20%] top-32 h-1.5 w-1.5 rounded-full bg-acento/50"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute left-[6%] bottom-24 h-2 w-2 rounded-full bg-acento-claro/60"
      />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-24">
        <div className="flex flex-col items-start gap-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-acento/20 bg-white/70 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.25em] text-acento backdrop-blur">
            Nueva temporada
          </p>
          <h1 className="max-w-xl text-4xl font-black leading-[1.05] text-texto-fuerte sm:text-5xl lg:text-6xl">
            Moda que te <span className="text-acento">acompaña</span> todos los
            días
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-texto">
            Carteras y accesorios de cuero para mujer. Piezas elegantes, hechas
            para durar y pensadas para tu día a día.
          </p>
          <Link
            href="/catalogo"
            className="group inline-flex items-center gap-2 rounded-full bg-acento px-7 py-3.5 text-base font-medium text-acento-contraste shadow-lg shadow-acento/30 transition-all hover:-translate-y-0.5 hover:bg-acento/90 hover:shadow-xl hover:shadow-acento/40"
          >
            Ver catálogo
            <IconArrowRight
              size={18}
              stroke={2}
              aria-hidden
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>

        <div className="relative flex items-center justify-center lg:justify-end">
          {/* Halo morado difuso detras de la imagen para dar profundidad. */}
          <span
            aria-hidden
            className="absolute h-72 w-72 rounded-full bg-acento/25 blur-3xl sm:h-96 sm:w-96"
          />
          <div className="relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] shadow-2xl shadow-acento/20 ring-1 ring-black/5">
            <Image
              src={IMAGEN_HERO}
              alt="Cartera de cuero Valentino Benites"
              fill
              priority
              sizes="(min-width: 1024px) 28rem, 90vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

const BENEFICIOS = [
  {
    icono: IconTruckDelivery,
    titulo: "Envíos a todo el Perú",
    detalle: "Recibe tu pedido donde estés, con seguimiento.",
  },
  {
    icono: IconShieldLock,
    titulo: "Pago seguro",
    detalle: "Yape, Plin o WhatsApp. Tu compra protegida.",
  },
  {
    icono: IconAward,
    titulo: "Cuero genuino",
    detalle: "Materiales de calidad, terminaciones cuidadas.",
  },
] as const;

function Beneficios() {
  return (
    <section aria-label="Por qué comprar con nosotros" className="bg-fondo">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-12 sm:grid-cols-3 sm:px-6 lg:px-8">
        {BENEFICIOS.map(({ icono: Icono, titulo, detalle }) => (
          <div
            key={titulo}
            className="flex items-start gap-4 rounded-2xl border border-borde bg-fondo p-5 transition-colors hover:border-acento/30"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-acento/10 text-acento">
              <Icono size={22} stroke={1.8} aria-hidden />
            </span>
            <div>
              <h3 className="titulo-ui text-sm font-semibold text-texto-fuerte">
                {titulo}
              </h3>
              <p className="mt-1 text-sm text-texto">{detalle}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AtajosCategorias({ categorias }: { categorias: Categoria[] }) {
  return (
    <section
      aria-labelledby="titulo-categorias"
      className="bg-perla"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 id="titulo-categorias" className="text-3xl font-extrabold sm:text-4xl">
          Compra por categoría
        </h2>
        <p className="mt-3 max-w-md text-texto">
          Encuentra lo que buscas según tu estilo y ocasión.
        </p>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categorias.map((categoria) => (
            <li key={categoria.id}>
              <Link
                href={`/catalogo?categoria=${categoria.slug}`}
                className="group flex h-full items-center justify-between gap-3 rounded-2xl border border-borde bg-fondo px-5 py-6 shadow-[0_1px_3px_rgba(17,17,17,0.04)] transition-all hover:-translate-y-1 hover:border-acento/40 hover:shadow-[0_16px_32px_-14px_rgba(125,33,129,0.3)]"
              >
                <span className="text-base font-medium text-texto-fuerte transition-colors group-hover:text-acento">
                  {categoria.nombre}
                </span>
                <IconArrowRight
                  size={18}
                  stroke={2}
                  aria-hidden
                  className="shrink-0 text-texto/40 transition-all group-hover:translate-x-1 group-hover:text-acento"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ProductosDestacados({ productos }: { productos: Producto[] }) {
  return (
    <section
      aria-labelledby="titulo-destacados"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="flex items-end justify-between gap-4">
        <h2 id="titulo-destacados" className="text-3xl font-extrabold sm:text-4xl">
          Destacados
        </h2>
        <Link
          href="/catalogo"
          className="titulo-ui inline-flex items-center gap-1.5 text-sm font-medium text-acento transition-colors hover:text-acento-claro"
        >
          Ver todo
          <IconArrowRight size={16} stroke={2} aria-hidden />
        </Link>
      </div>
      <div className="mt-10">
        <GrillaProductos
          productos={productos}
          mensajeVacio="Pronto tendremos productos destacados."
        />
      </div>
    </section>
  );
}
