import Link from "next/link";
import {
  IconArrowRight,
  IconAward,
  IconShieldLock,
  IconSparkles,
  IconTruckDelivery,
} from "@tabler/icons-react";
import { BotonPremium, Eyebrow, Revelar } from "@/components/ui";
import { GrillaProductos, HeroSlider, Newsletter } from "@/components/tienda";
import {
  listarCategorias,
  listarProductos,
  obtenerConfiguracion,
} from "@/lib/api";
import type { Banner, Categoria, Producto } from "@/lib/tipos";

/** Datos del hero que la clienta administra desde el panel. */
interface ContenidoHero {
  banners: Banner[];
  titulo: string | null;
  subtitulo: string | null;
  textoClaro: boolean;
}

/**
 * Home del storefront Valentino Benites: hero con producto protagonista, atajos
 * por categoria, prueba de confianza, grilla de destacados y newsletter.
 * Server component; degrada sin romper si la API no responde.
 */
export default async function PaginaInicio() {
  const [destacados, categorias, hero] = await Promise.all([
    cargarDestacados(),
    cargarCategorias(),
    cargarHero(),
  ]);

  // Fallback del hero: foto de un producto destacado (sin imágenes hardcodeadas).
  const imagenHero =
    destacados.find((producto) => producto.imagenes.length > 0)?.imagenes[0]
      ?.url ?? null;

  return (
    <>
      <HeroSlider
        banners={hero.banners}
        imagenUrlFallback={imagenHero}
        titulo={hero.titulo}
        subtitulo={hero.subtitulo}
        textoClaro={hero.textoClaro}
      />
      <Beneficios />
      {categorias.length > 0 && <AtajosCategorias categorias={categorias} />}
      <ProductosDestacados productos={destacados} />
      <BandaMarca />
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

async function cargarHero(): Promise<ContenidoHero> {
  try {
    const configuracion = await obtenerConfiguracion();
    return {
      banners: configuracion.banners ?? [],
      titulo: configuracion.heroTitulo,
      subtitulo: configuracion.heroSubtitulo,
      textoClaro: configuracion.heroTextoClaro,
    };
  } catch {
    // Sin API: degrada al hero con degradado de marca y textos por defecto.
    return { banners: [], titulo: null, subtitulo: null, textoClaro: true };
  }
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
    <section
      aria-label="Por qué comprar con nosotros"
      className="border-y border-borde bg-perla"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-12 sm:grid-cols-3 sm:px-6 lg:px-8">
        {BENEFICIOS.map(({ icono: Icono, titulo, detalle }) => (
          <div
            key={titulo}
            className="flex items-start gap-4 rounded-2xl border border-borde bg-superficie p-5 shadow-[0_2px_8px_-4px_rgba(36,21,34,0.08)] transition-[transform,box-shadow,border-color] duration-500 ease-suave hover:-translate-y-0.5 hover:border-acento/30 hover:shadow-[0_18px_34px_-20px_rgba(125,33,129,0.3)]"
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
      className="relative overflow-hidden bg-rosa"
    >
      <span
        aria-hidden
        className="fondo-puntos pointer-events-none absolute inset-0 opacity-50"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Revelar>
          <Eyebrow>Explora por estilo</Eyebrow>
          <h2
            id="titulo-categorias"
            className="mt-5 text-3xl font-normal sm:text-4xl lg:text-5xl"
          >
            Compra por <span className="italic text-acento">categoría</span>
          </h2>
          <p className="mt-4 max-w-md text-texto">
            Encuentra lo que buscas según tu estilo y ocasión.
          </p>
        </Revelar>
        <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categorias.map((categoria, indice) => (
            <li key={categoria.id}>
              <Revelar delay={Math.min(indice, 6) * 60}>
                <Link
                  href={`/catalogo?categoria=${categoria.slug}`}
                  className="group flex h-full items-center justify-between gap-3 rounded-2xl border border-borde bg-superficie px-5 py-6 shadow-[0_1px_3px_rgba(17,17,17,0.04)] transition-[transform,box-shadow,border-color] duration-500 ease-suave hover:-translate-y-1 hover:border-acento/40 hover:shadow-[0_16px_32px_-14px_rgba(125,33,129,0.3)]"
                >
                  <span className="text-base font-medium text-texto-fuerte transition-colors group-hover:text-acento">
                    {categoria.nombre}
                  </span>
                  <IconArrowRight
                    size={18}
                    stroke={2}
                    aria-hidden
                    className="shrink-0 text-texto/40 transition-all duration-500 ease-suave group-hover:translate-x-1 group-hover:text-acento"
                  />
                </Link>
              </Revelar>
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
      className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
    >
      <Revelar>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Lo más querido</Eyebrow>
            <h2
              id="titulo-destacados"
              className="mt-5 text-3xl font-normal sm:text-4xl lg:text-5xl"
            >
              Destacados de la <span className="italic text-acento">casa</span>
            </h2>
          </div>
          <Link
            href="/catalogo"
            className="titulo-ui inline-flex items-center gap-1.5 text-sm font-semibold text-acento transition-colors hover:text-acento-claro"
          >
            Ver todo
            <IconArrowRight size={16} stroke={2} aria-hidden />
          </Link>
        </div>
      </Revelar>
      <Revelar delay={80} className="mt-10">
        <GrillaProductos
          productos={productos}
          mensajeVacio="Pronto tendremos productos destacados."
        />
      </Revelar>
    </section>
  );
}

/**
 * Banda de marca: enunciado editorial fuerte sobre el morado de identidad, con
 * el CTA premium para arrancar un pedido. Los titulares dentro de .storefront se
 * fuerzan a tinta oscura por globals.css; sobre el morado necesitamos texto
 * claro, asi que el color va inline (mismo patron que el hero) para vencer esa
 * regla sin bajar la especificidad global.
 */
function BandaMarca() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <Revelar>
        <div className="relative overflow-hidden rounded-[2rem] bg-acento px-8 py-14 sm:px-12 lg:px-16 lg:py-16">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full opacity-50 [background:radial-gradient(circle,var(--color-acento-claro),transparent_70%)]"
          />
          <div className="relative max-w-2xl">
            <Eyebrow sobreOscuro>Hecho en Perú</Eyebrow>
            <h2
              className="mt-5 max-w-[20ch] text-3xl font-normal leading-[1.08] sm:text-4xl lg:text-5xl"
              style={{ color: "#ffffff" }}
            >
              No compras un stock. Encargas una pieza pensada para ti.
            </h2>
            <p className="mt-5 max-w-xl leading-relaxed text-[#f0d6ee]">
              Eliges el modelo, eliges el color, y lo fabricamos a mano para tu
              pedido. Sin depósitos gigantes, sin sobras — solo lo que de verdad
              quieres llevar.
            </p>
            <div className="mt-8">
              <BotonPremium
                href="/catalogo"
                icono={IconSparkles}
                variante="claro"
              >
                Empieza tu pedido
              </BotonPremium>
            </div>
          </div>
        </div>
      </Revelar>
    </section>
  );
}
