import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  IconArrowRight,
  IconNeedleThread,
  IconPalette,
  IconWorld,
} from "@tabler/icons-react";
import { BotonPremium, EncabezadoContenido, Eyebrow, Revelar } from "@/components/ui";
import { listarProductos } from "@/lib/api";
import type { Producto } from "@/lib/tipos";

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "Valentino Benites nace como una iniciativa familiar. Carteras y bolsos que combinan cuero con telares andinos tejidos en el Perú, confeccionados a pedido.",
  alternates: { canonical: "/nosotros" },
};

/** Tres piezas destacadas para mostrar el telar; degrada a nada si falla la API. */
async function cargarMuestra(): Promise<Producto[]> {
  try {
    const productos = await listarProductos({ destacados: true });
    return productos.slice(0, 3);
  } catch {
    return [];
  }
}

const PILARES = [
  {
    Icono: IconNeedleThread,
    titulo: "Oficio familiar",
    texto:
      "El conocimiento de confeccionar carteras y bolsos, aprendido en casa y perfeccionado con los años.",
  },
  {
    Icono: IconPalette,
    titulo: "Hecho a pedido",
    texto:
      "Eliges tu modelo y tu color, y recién ahí lo confeccionamos para ti. Cada pieza se trabaja de forma individual.",
  },
  {
    Icono: IconWorld,
    titulo: "Identidad peruana",
    texto:
      "Telares andinos tejidos en el Perú en cada diseño: nuestra cultura en un accesorio de uso diario.",
  },
];

export default async function PaginaNosotros() {
  const muestra = await cargarMuestra();

  return (
    <>
      <section className="bg-gradient-to-b from-perla to-fondo">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20 lg:px-8">
          <Revelar>
            <EncabezadoContenido
              seccion="Quiénes somos"
              titulo={
                <>
                  Nuestra cultura, tejida en cada{" "}
                  <span className="italic text-acento">pieza</span>
                </>
              }
            />
          </Revelar>

          <Revelar delay={80}>
            <div className="mt-8 max-w-2xl space-y-5 text-base leading-relaxed text-texto">
              <p>
                Valentino Benites nace como una iniciativa familiar: el oficio de
                confeccionar carteras y bolsos, aprendido en casa y perfeccionado
                con los años.
              </p>
              <p>
                Cada pieza combina cuero trabajado con{" "}
                <span className="font-medium text-texto-fuerte">
                  telares andinos tejidos en el Perú
                </span>
                . Ese tejido no es un adorno: es nuestra manera de llevar la
                cultura peruana en un accesorio de uso diario.
              </p>
              <p>
                Y trabajamos a pedido. Cuando eliges tu modelo y tu color, recién
                ahí lo confeccionamos para ti. Por eso cada cartera sale con el
                cuidado de una pieza única y no de una producción en serie.
              </p>
            </div>
          </Revelar>
        </div>
      </section>

      {muestra.length > 0 && (
        <section aria-label="Piezas de nuestro taller" className="bg-fondo">
          <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
            <Revelar>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                {muestra.map((producto) => {
                  const foto =
                    producto.imagenes?.[0]?.url ??
                    producto.variantes?.[0]?.imagenesEfectivas?.[0]?.url ??
                    null;
                  if (!foto) return null;
                  return (
                    <Link
                      key={producto.id}
                      href={`/producto/${producto.slug}`}
                      className="group relative block overflow-hidden rounded-2xl border border-borde bg-perla focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento focus-visible:ring-offset-2"
                    >
                      <div className="relative aspect-[4/5]">
                        <Image
                          src={foto}
                          alt={producto.nombre}
                          fill
                          sizes="(min-width: 640px) 33vw, 100vw"
                          className="object-cover transition-transform duration-700 ease-suave group-hover:scale-[1.05]"
                        />
                      </div>
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-sm font-medium text-white">
                        {producto.nombre}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </Revelar>
          </div>
        </section>
      )}

      <section className="border-t border-borde bg-perla">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Revelar>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {PILARES.map(({ Icono, titulo, texto }) => (
                <div key={titulo}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-acento/10 text-acento">
                    <Icono size={24} stroke={1.5} aria-hidden />
                  </span>
                  <h2 className="mt-4 text-lg font-semibold text-texto-fuerte">
                    {titulo}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-texto">{texto}</p>
                </div>
              ))}
            </div>
          </Revelar>
        </div>
      </section>

      <section className="bg-fondo">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <Revelar>
              <article className="h-full rounded-2xl border border-borde bg-superficie p-8">
                <Eyebrow>Misión</Eyebrow>
                <p className="mt-5 text-lg leading-relaxed text-texto-fuerte">
                  Ofrecer a cada mujer carteras y accesorios que combinen calidad,
                  diseño e identidad peruana, confeccionados a pedido en el estilo
                  y el color que ella elige, para acompañarla todos los días.
                </p>
              </article>
            </Revelar>
            <Revelar delay={80}>
              <article className="h-full rounded-2xl border border-borde bg-superficie p-8">
                <Eyebrow>Visión</Eyebrow>
                <p className="mt-5 text-lg leading-relaxed text-texto-fuerte">
                  Llevar nuestras piezas más allá del Perú y dar a conocer al mundo
                  nuestra cultura a través de nuestros telares, siendo una marca
                  reconocida por su calidad y por la satisfacción de quienes nos
                  eligen.
                </p>
              </article>
            </Revelar>
          </div>

          <Revelar delay={140}>
            <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <BotonPremium href="/catalogo" icono={IconArrowRight}>
                Ver el catálogo
              </BotonPremium>
              <Link
                href="/como-comprar"
                className="text-sm font-medium text-acento underline underline-offset-4"
              >
                Cómo comprar paso a paso
              </Link>
            </div>
          </Revelar>
        </div>
      </section>
    </>
  );
}
