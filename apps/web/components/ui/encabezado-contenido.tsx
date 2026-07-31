import type { ReactNode } from "react";
import { Eyebrow } from "./eyebrow";

interface PropsEncabezadoContenido {
  /** Micro-titulo de seccion (pildora superior). */
  seccion: string;
  /** Admite JSX para resaltar una palabra en cursiva/acento. */
  titulo: ReactNode;
  /** Bajada opcional bajo el titulo. */
  descripcion?: ReactNode;
}

/**
 * Encabezado comun de las paginas de contenido (nosotros, ayuda, politicas).
 * Homologa la jerarquia tipografica del storefront: eyebrow + h1 serif + bajada.
 */
export function EncabezadoContenido({
  seccion,
  titulo,
  descripcion,
}: PropsEncabezadoContenido) {
  return (
    <header className="max-w-2xl">
      <Eyebrow>{seccion}</Eyebrow>
      <h1 className="mt-5 text-3xl font-normal tracking-tight text-texto-fuerte sm:text-4xl lg:text-5xl">
        {titulo}
      </h1>
      {descripcion && (
        <p className="mt-4 text-base leading-relaxed text-texto">{descripcion}</p>
      )}
    </header>
  );
}
