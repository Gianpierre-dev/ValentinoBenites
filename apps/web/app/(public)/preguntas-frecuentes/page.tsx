import type { Metadata } from "next";
import Link from "next/link";
import { IconChevronDown } from "@tabler/icons-react";
import { EncabezadoContenido, Revelar } from "@/components/ui";
import { GRUPOS_PREGUNTAS, todasLasPreguntas } from "@/lib/preguntas-frecuentes";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Resolvemos tus dudas sobre plazos de elaboración, medios de pago, envíos a todo el Perú y cambios en Valentino Benites.",
  alternates: { canonical: "/preguntas-frecuentes" },
};

/**
 * Preguntas frecuentes. Incluye JSON-LD FAQPage: Google puede mostrar estas
 * preguntas desplegables directamente en los resultados de busqueda.
 */
export default function PaginaPreguntasFrecuentes() {
  const schemaFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: todasLasPreguntas().map(({ pregunta, respuesta }) => ({
      "@type": "Question",
      name: pregunta,
      acceptedAnswer: { "@type": "Answer", text: respuesta },
    })),
  };

  return (
    <div className="bg-gradient-to-b from-perla to-fondo">
      <script
        type="application/ld+json"
        // Contenido propio y estatico; se escapa "<" por higiene (JSON-LD).
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaFaq).replace(/</g, "\\u003c"),
        }}
      />

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20 lg:px-8">
        <Revelar>
          <EncabezadoContenido
            seccion="Ayuda"
            titulo={
              <>
                Preguntas <span className="italic text-acento">frecuentes</span>
              </>
            }
            descripcion="Todo lo que necesitas saber antes de hacer tu pedido. Si no encuentras tu respuesta, escríbenos por WhatsApp."
          />
        </Revelar>

        <div className="mt-12 space-y-10">
          {GRUPOS_PREGUNTAS.map((grupo, indice) => (
            <Revelar key={grupo.titulo} delay={indice * 60}>
              <section aria-labelledby={`grupo-${indice}`}>
                <h2
                  id={`grupo-${indice}`}
                  className="titulo-ui text-sm font-semibold uppercase tracking-[0.14em] text-acento"
                >
                  {grupo.titulo}
                </h2>
                <div className="mt-4 divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
                  {grupo.preguntas.map(({ pregunta, respuesta }) => (
                    <details key={pregunta} className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-texto-fuerte transition-colors hover:text-acento focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-acento">
                        {pregunta}
                        <IconChevronDown
                          size={18}
                          aria-hidden
                          className="shrink-0 text-texto/50 transition-transform duration-300 group-open:rotate-180 motion-reduce:transition-none"
                        />
                      </summary>
                      <p className="px-5 pb-5 text-sm leading-relaxed text-texto">
                        {respuesta}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            </Revelar>
          ))}
        </div>

        <Revelar delay={220}>
          <p className="mt-12 rounded-2xl border border-borde bg-superficie p-6 text-sm text-texto">
            ¿No resolvimos tu duda? Escríbenos por WhatsApp con el botón verde del
            sitio, o revisa{" "}
            <Link href="/como-comprar" className="font-medium text-acento underline">
              cómo comprar paso a paso
            </Link>
            .
          </p>
        </Revelar>
      </div>
    </div>
  );
}
