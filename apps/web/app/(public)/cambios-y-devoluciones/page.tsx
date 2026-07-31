import type { Metadata } from "next";
import Link from "next/link";
import { IconCheck, IconX } from "@tabler/icons-react";
import { EncabezadoContenido, Revelar } from "@/components/ui";

export const metadata: Metadata = {
  title: "Cambios y devoluciones",
  description:
    "Política de cambios y devoluciones de Valentino Benites: qué cubrimos ante un defecto de fabricación y qué condiciones aplican a los productos hechos a pedido.",
  alternates: { canonical: "/cambios-y-devoluciones" },
};

const SI_APLICA = [
  "Tu producto llegó con un defecto de fabricación (costuras, herrajes, tejido).",
  "Recibiste un modelo o un color distinto al que confirmaste.",
  "El producto llegó dañado durante el transporte.",
];

const NO_APLICA = [
  "Cambio de opinión sobre el color que elegiste y confirmaste para tu pieza.",
  "Variaciones menores de tono o de posición del tejido, propias de una pieza artesanal.",
  "Desgaste por uso o daños ocasionados después de la entrega.",
];

export default function PaginaCambiosDevoluciones() {
  return (
    <div className="bg-gradient-to-b from-perla to-fondo">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20 lg:px-8">
        <Revelar>
          <EncabezadoContenido
            seccion="Ayuda"
            titulo={
              <>
                Cambios y{" "}
                <span className="italic text-acento">devoluciones</span>
              </>
            }
            descripcion="Queremos que tu pieza llegue perfecta. Si algo salió mal por nuestra parte, lo resolvemos."
          />
        </Revelar>

        <Revelar delay={80}>
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-green-600/25 bg-green-600/[.04] p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold text-texto-fuerte">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-white">
                  <IconCheck size={16} aria-hidden />
                </span>
                Sí gestionamos cambio
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-texto">
                {SI_APLICA.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden className="text-green-700">
                      •
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-borde bg-superficie p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold text-texto-fuerte">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-texto/15 text-texto-fuerte">
                  <IconX size={16} aria-hidden />
                </span>
                No aplica cambio
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-texto">
                {NO_APLICA.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden className="text-texto/50">
                      •
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Revelar>

        <Revelar delay={160}>
          <div className="mt-10 space-y-6 text-sm leading-relaxed text-texto">
            <section>
              <h2 className="text-lg font-semibold text-texto-fuerte">
                Plazo para solicitarlo
              </h2>
              <p className="mt-2">
                Tienes <span className="font-medium text-texto-fuerte">7 días</span>{" "}
                desde que recibes tu pedido para escribirnos por WhatsApp si
                presenta un defecto de fabricación. Gestionamos el cambio o la
                reparación sin costo para ti.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-texto-fuerte">
                Cómo lo solicitas
              </h2>
              <p className="mt-2">
                Escríbenos por WhatsApp con tu código de pedido y una foto donde se
                vea el problema. Revisamos tu caso y coordinamos contigo la
                solución y la logística del cambio.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-texto-fuerte">
                Por qué los productos personalizados tienen condiciones distintas
              </h2>
              <p className="mt-2">
                Cada pieza se confecciona después de tu pedido, en el color que tú
                elegiste. Al tratarse de un bien elaborado conforme a tus
                especificaciones, no admite cambio ni devolución por motivos
                distintos a un defecto de fabricación. Esto está detallado en
                nuestros{" "}
                <Link href="/terminos" className="font-medium text-acento underline">
                  Términos y Condiciones
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-texto-fuerte">
                Si no llegamos a un acuerdo
              </h2>
              <p className="mt-2">
                Puedes registrar tu caso en nuestro{" "}
                <Link
                  href="/libro-de-reclamaciones"
                  className="font-medium text-acento underline"
                >
                  Libro de Reclamaciones
                </Link>{" "}
                virtual. Te responderemos en un plazo máximo de 15 días hábiles,
                conforme a la Ley N.º 29571.
              </p>
            </section>
          </div>
        </Revelar>
      </div>
    </div>
  );
}
