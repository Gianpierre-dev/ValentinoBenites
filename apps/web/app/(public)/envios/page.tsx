import type { Metadata } from "next";
import Link from "next/link";
import { IconClock, IconMapPin, IconTruck } from "@tabler/icons-react";
import { EncabezadoContenido, Revelar } from "@/components/ui";

export const metadata: Metadata = {
  title: "Envíos y entregas",
  description:
    "Enviamos a todo el Perú. Conoce los plazos de elaboración y entrega, y cómo coordinamos el costo del envío según tu destino.",
  alternates: { canonical: "/envios" },
};

const PUNTOS = [
  {
    Icono: IconClock,
    titulo: "Plazo de elaboración",
    texto:
      "Aproximadamente 24 horas desde que confirmamos tu pago y el color de tu pieza. Recién entonces comienza el envío.",
  },
  {
    Icono: IconMapPin,
    titulo: "Cobertura",
    texto:
      "Enviamos a todo el Perú a través de empresas de transporte y mensajería. En Lima también podemos coordinar entrega directa.",
  },
  {
    Icono: IconTruck,
    titulo: "Costo del envío",
    texto:
      "Depende de tu destino y de la empresa de transporte. Lo coordinamos contigo por WhatsApp al confirmar el pedido, antes de despachar.",
  },
];

export default function PaginaEnvios() {
  return (
    <div className="bg-gradient-to-b from-perla to-fondo">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20 lg:px-8">
        <Revelar>
          <EncabezadoContenido
            seccion="Ayuda"
            titulo={
              <>
                Envíos y <span className="italic text-acento">entregas</span>
              </>
            }
            descripcion="Trabajamos a pedido, así que el tiempo total tiene dos partes: la elaboración de tu pieza y el envío hasta tu dirección."
          />
        </Revelar>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {PUNTOS.map(({ Icono, titulo, texto }, indice) => (
            <Revelar key={titulo} delay={indice * 60}>
              <div className="h-full rounded-2xl border border-borde bg-superficie p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-acento/10 text-acento">
                  <Icono size={22} stroke={1.5} aria-hidden />
                </span>
                <h2 className="mt-4 text-base font-semibold text-texto-fuerte">
                  {titulo}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-texto">{texto}</p>
              </div>
            </Revelar>
          ))}
        </div>

        <Revelar delay={200}>
          <div className="mt-10 space-y-6 text-sm leading-relaxed text-texto">
            <section>
              <h2 className="text-lg font-semibold text-texto-fuerte">
                Cómo coordinamos tu envío
              </h2>
              <p className="mt-2">
                Cuando completas tu pedido recibes un código de registro. Con ese
                código nos escribes por WhatsApp (o te escribimos nosotros) para
                confirmar tu dirección de entrega, la empresa de transporte que
                prefieres y el costo del envío a tu destino.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-texto-fuerte">
                Seguimiento
              </h2>
              <p className="mt-2">
                Una vez despachada tu pieza te compartimos los datos de envío por
                WhatsApp para que puedas hacer el seguimiento con la empresa de
                transporte.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-texto-fuerte">
                Importante
              </h2>
              <p className="mt-2">
                Los precios publicados en el catálogo corresponden únicamente al
                producto y no incluyen el costo de envío. Revisa también nuestros{" "}
                <Link href="/terminos" className="font-medium text-acento underline">
                  Términos y Condiciones
                </Link>{" "}
                y la política de{" "}
                <Link
                  href="/cambios-y-devoluciones"
                  className="font-medium text-acento underline"
                >
                  cambios y devoluciones
                </Link>
                .
              </p>
            </section>
          </div>
        </Revelar>
      </div>
    </div>
  );
}
