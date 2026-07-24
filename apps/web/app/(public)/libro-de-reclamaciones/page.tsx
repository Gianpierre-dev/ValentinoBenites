import type { Metadata } from "next";
import { IconBook2 } from "@tabler/icons-react";
import { obtenerConfiguracion } from "@/lib/api";
import { FormularioReclamo } from "./formulario-reclamo";

export const metadata: Metadata = {
  title: "Libro de Reclamaciones",
  description:
    "Libro de Reclamaciones virtual de Valentino Benites, conforme al Código de Protección y Defensa del Consumidor (Ley N.º 29571).",
};

/**
 * Libro de Reclamaciones virtual (Ley 29571 + DS 011-2011, mod. DS 101-2022).
 * Muestra la identificacion del proveedor (de Configuracion) y el formulario
 * de la hoja de reclamacion. La respuesta al consumidor tiene un plazo legal
 * de 15 dias habiles.
 */
export default async function PaginaLibroReclamaciones() {
  let proveedor = { razonSocial: null as string | null, ruc: null as string | null, direccion: null as string | null };
  try {
    const config = await obtenerConfiguracion();
    proveedor = {
      razonSocial: config.razonSocial,
      ruc: config.ruc,
      direccion: config.direccion,
    };
  } catch {
    // Sin configuracion: la hoja funciona igual, sin los datos del proveedor.
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14 lg:px-8">
      <header className="flex flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-acento/10 text-acento">
          <IconBook2 size={28} aria-hidden />
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-texto-fuerte sm:text-4xl">
          Libro de Reclamaciones
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-texto">
          Conforme al Código de Protección y Defensa del Consumidor (Ley N.º 29571)
          y su reglamento, ponemos a tu disposición este Libro de Reclamaciones
          virtual. Registra tu reclamo o queja y te responderemos en un plazo
          máximo de 15 días hábiles.
        </p>
      </header>

      <section
        aria-label="Datos del proveedor"
        className="mt-8 rounded-2xl border border-borde bg-perla p-5 text-sm text-texto"
      >
        <h2 className="titulo-ui text-xs font-semibold uppercase tracking-wide text-texto-fuerte">
          Datos del proveedor
        </h2>
        <dl className="mt-3 space-y-1">
          <div className="flex gap-2">
            <dt className="font-medium text-texto-fuerte">Razón social:</dt>
            <dd>{proveedor.razonSocial ?? "Valentino Benites"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-texto-fuerte">RUC:</dt>
            <dd>{proveedor.ruc ?? "Por completar"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-texto-fuerte">Domicilio:</dt>
            <dd>{proveedor.direccion ?? "Lima, Perú"}</dd>
          </div>
        </dl>
      </section>

      <div className="mt-8">
        <FormularioReclamo />
      </div>
    </div>
  );
}
