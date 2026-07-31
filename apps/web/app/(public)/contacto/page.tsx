import type { Metadata } from "next";
import Link from "next/link";
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandWhatsapp,
  IconClock,
} from "@tabler/icons-react";
import { EncabezadoContenido, Revelar } from "@/components/ui";
import { obtenerConfiguracion } from "@/lib/api";
import { construirEnlaceWhatsApp } from "@/lib/checkout";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Escríbenos por WhatsApp o síguenos en redes. Resolvemos tus dudas sobre modelos, colores, envíos y pedidos.",
  alternates: { canonical: "/contacto" },
};

const MENSAJE_CONTACTO = "Hola, tengo una consulta sobre sus productos.";

/**
 * Pagina de contacto: canales reales del negocio (WhatsApp y redes) leidos de
 * Configuracion, mas los accesos a ayuda y al Libro de Reclamaciones. Degrada
 * sin romper si la API no responde.
 */
export default async function PaginaContacto() {
  let whatsapp: string | null = null;
  let redes: { nombre: string; url: string; Icono: typeof IconBrandInstagram }[] =
    [];

  try {
    const config = await obtenerConfiguracion();
    whatsapp = construirEnlaceWhatsApp(config.whatsapp, MENSAJE_CONTACTO);
    if (config.instagram) {
      redes.push({
        nombre: "Instagram",
        url: `https://instagram.com/${config.instagram}`,
        Icono: IconBrandInstagram,
      });
    }
    if (config.facebook) {
      redes.push({
        nombre: "Facebook",
        url: `https://facebook.com/${config.facebook}`,
        Icono: IconBrandFacebook,
      });
    }
    if (config.tiktok) {
      redes.push({
        nombre: "TikTok",
        url: `https://tiktok.com/@${config.tiktok}`,
        Icono: IconBrandTiktok,
      });
    }
  } catch {
    redes = [];
  }

  return (
    <div className="bg-gradient-to-b from-perla to-fondo">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20 lg:px-8">
        <Revelar>
          <EncabezadoContenido
            seccion="Contacto"
            titulo={
              <>
                Hablemos de tu <span className="italic text-acento">pieza</span>
              </>
            }
            descripcion="¿Buscas un color que no ves en el catálogo o tienes dudas sobre tu pedido? Escríbenos: respondemos personalmente."
          />
        </Revelar>

        <Revelar delay={80}>
          <div className="mt-12 rounded-2xl border border-borde bg-superficie p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-texto-fuerte">
              WhatsApp, nuestro canal principal
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-texto">
              Es la forma más rápida de contactarnos. Por ahí coordinamos colores,
              envíos y el estado de tu pedido.
            </p>
            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-semibold text-white transition-all duration-300 ease-suave hover:bg-[#1fb857] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:transition-none"
              >
                <IconBrandWhatsapp size={20} aria-hidden />
                Escribir por WhatsApp
              </a>
            ) : (
              <p className="mt-5 rounded-xl border border-borde bg-perla px-4 py-3 text-sm text-texto">
                Nuestro número de WhatsApp estará disponible en breve. Mientras
                tanto, escríbenos por redes sociales.
              </p>
            )}

            <p className="mt-5 flex items-center gap-2 text-sm text-texto">
              <IconClock size={18} aria-hidden className="text-texto/50" />
              Atención de lunes a sábado. Respondemos los mensajes en el día.
            </p>
          </div>
        </Revelar>

        {redes.length > 0 && (
          <Revelar delay={140}>
            <div className="mt-6 rounded-2xl border border-borde bg-superficie p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-texto-fuerte">
                Síguenos en redes
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-texto">
                Publicamos nuevos modelos, colores y piezas recién salidas del
                taller.
              </p>
              <ul className="mt-5 flex flex-wrap gap-3">
                {redes.map(({ nombre, url, Icono }) => (
                  <li key={nombre}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 items-center gap-2 rounded-full border border-borde px-5 text-sm font-medium text-texto-fuerte transition-colors hover:border-acento/40 hover:text-acento focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento"
                    >
                      <Icono size={20} stroke={1.5} aria-hidden />
                      {nombre}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Revelar>
        )}

        <Revelar delay={200}>
          <div className="mt-6 rounded-2xl border border-borde bg-perla p-6 text-sm leading-relaxed text-texto sm:p-8">
            <h2 className="text-lg font-semibold text-texto-fuerte">
              Antes de escribirnos
            </h2>
            <p className="mt-2">
              Quizá tu duda ya esté resuelta en{" "}
              <Link
                href="/preguntas-frecuentes"
                className="font-medium text-acento underline"
              >
                preguntas frecuentes
              </Link>
              ,{" "}
              <Link href="/envios" className="font-medium text-acento underline">
                envíos
              </Link>{" "}
              o{" "}
              <Link
                href="/cambios-y-devoluciones"
                className="font-medium text-acento underline"
              >
                cambios y devoluciones
              </Link>
              .
            </p>
            <p className="mt-3">
              Para presentar un reclamo o queja formal, usa nuestro{" "}
              <Link
                href="/libro-de-reclamaciones"
                className="font-medium text-acento underline"
              >
                Libro de Reclamaciones
              </Link>{" "}
              virtual.
            </p>
          </div>
        </Revelar>
      </div>
    </div>
  );
}
