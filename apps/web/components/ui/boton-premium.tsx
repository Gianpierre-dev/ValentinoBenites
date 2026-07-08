import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import type { IconProps } from "@tabler/icons-react";
import { cn } from "@/lib/utilidades";

/**
 * Variantes segun el fondo donde se apoya el boton:
 * - "solido": morado pleno sobre crema (CTA principal).
 * - "fantasma": blanco con borde sobre crema (CTA secundario).
 * - "claro": blanco sobre superficies oscuras/moradas (banda de marca).
 */
type VariantePremium = "solido" | "fantasma" | "claro";

interface PropsBase {
  children: ReactNode;
  /** Icono tabler que vive dentro de su propio circulo (button-in-button). */
  icono: ComponentType<IconProps>;
  variante?: VariantePremium;
  className?: string;
}

/** Como enlace de navegacion (usa Next Link). */
interface PropsEnlace extends PropsBase {
  href: string;
  onClick?: never;
  type?: never;
}

/** Como boton de accion (onClick / submit). */
interface PropsBoton extends PropsBase {
  href?: undefined;
  onClick?: () => void;
  type?: "button" | "submit";
}

type PropsBotonPremium = PropsEnlace | PropsBoton;

const CONTENEDOR: Record<VariantePremium, string> = {
  solido:
    "bg-acento text-acento-contraste shadow-[0_14px_34px_-14px_rgba(125,33,129,0.55)] hover:shadow-[0_22px_46px_-14px_rgba(125,33,129,0.6)]",
  fantasma:
    "bg-superficie text-texto-fuerte border border-borde hover:border-acento/40",
  claro:
    "bg-white text-acento shadow-[0_14px_34px_-14px_rgba(0,0,0,0.3)] hover:shadow-[0_22px_46px_-14px_rgba(0,0,0,0.35)]",
};

const CIRCULO: Record<VariantePremium, string> = {
  solido: "bg-white/[0.16] text-current",
  fantasma: "bg-rosa text-acento",
  claro: "bg-rosa text-acento",
};

const CLASE_CONTENEDOR_BASE =
  "group inline-flex items-center gap-3.5 rounded-full py-3 pl-6 pr-3 text-sm font-semibold tracking-wide transition-[transform,box-shadow,background-color,border-color] duration-500 ease-suave hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60";

const CLASE_CIRCULO_BASE =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform duration-500 ease-suave group-hover:translate-x-0.5";

/**
 * Boton premium reutilizable "button-in-button": pildora con el icono anidado en
 * su propio circulo y microfisica de hover (se eleva, el icono avanza, y al
 * presionar cede con un scale). Renderiza un `Link` si recibe `href`, o un
 * `<button>` en caso contrario. Es la unica fuente del lenguaje de CTA del sitio
 * para poder extenderlo (nuevas variantes) desde un solo lugar.
 */
export function BotonPremium(props: PropsBotonPremium) {
  const { children, icono: Icono, variante = "solido", className } = props;

  const contenido = (
    <>
      <span>{children}</span>
      <span aria-hidden className={cn(CLASE_CIRCULO_BASE, CIRCULO[variante])}>
        <Icono size={18} stroke={2} />
      </span>
    </>
  );

  const clases = cn(CLASE_CONTENEDOR_BASE, CONTENEDOR[variante], className);

  if (props.href !== undefined) {
    return (
      <Link href={props.href} className={clases}>
        {contenido}
      </Link>
    );
  }

  return (
    <button type={props.type ?? "button"} onClick={props.onClick} className={clases}>
      {contenido}
    </button>
  );
}
