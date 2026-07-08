import {
  IconClockHour4,
  IconDeviceMobile,
  IconLock,
  IconShieldCheck,
  IconTruckDelivery,
  type IconProps,
} from "@tabler/icons-react";
import type { ComponentType } from "react";

/** Un punto de confianza: icono + titulo corto + detalle opcional. */
interface PuntoConfianza {
  icono: ComponentType<IconProps>;
  titulo: string;
  detalle?: string;
}

/** Confianza para la ficha de producto (reutiliza el patron visual del home). */
const CONFIANZA_FICHA: readonly PuntoConfianza[] = [
  {
    icono: IconClockHour4,
    titulo: "Hecho a pedido",
    detalle: "Listo en aproximadamente 24 h.",
  },
  {
    icono: IconDeviceMobile,
    titulo: "Pago fácil",
    detalle: "Yape, Plin o WhatsApp.",
  },
  {
    icono: IconTruckDelivery,
    titulo: "Envíos a todo el Perú",
    detalle: "Recíbelo donde estés, con seguimiento.",
  },
] as const;

/** Confianza compacta para el checkout (reduce fricción antes del CTA). */
const CONFIANZA_CHECKOUT: readonly PuntoConfianza[] = [
  {
    icono: IconShieldCheck,
    titulo: "Compra segura",
  },
  {
    icono: IconLock,
    titulo: "Tus datos solo se usan para coordinar tu pedido",
  },
  {
    icono: IconClockHour4,
    titulo: "Hecho a pedido, listo en ~24 h",
  },
] as const;

interface PropsBloqueConfianza {
  /** "tarjetas": grilla con icono+titulo+detalle (ficha). "lista": filas compactas (checkout). */
  variante: "tarjetas" | "lista";
}

/**
 * Prueba de confianza reutilizable. Homologa el lenguaje visual del home
 * (icono en círculo con el acento morado) en la ficha de producto y el checkout,
 * sin duplicar estilos entre pantallas.
 */
export function BloqueConfianza({ variante }: PropsBloqueConfianza) {
  if (variante === "lista") {
    return (
      <ul
        aria-label="Garantías de tu compra"
        className="flex flex-col gap-3 rounded-2xl border border-borde bg-perla p-5"
      >
        {CONFIANZA_CHECKOUT.map(({ icono: Icono, titulo }) => (
          <li key={titulo} className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-acento/10 text-acento">
              <Icono size={17} stroke={1.8} aria-hidden />
            </span>
            <span className="text-sm text-texto">{titulo}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section
      aria-label="Garantías de tu compra"
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      {CONFIANZA_FICHA.map(({ icono: Icono, titulo, detalle }) => (
        <div
          key={titulo}
          className="flex items-start gap-3 rounded-2xl border border-borde bg-fondo p-4 transition-colors hover:border-acento/30"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-acento/10 text-acento">
            <Icono size={20} stroke={1.8} aria-hidden />
          </span>
          <div>
            <h3 className="titulo-ui text-sm font-semibold text-texto-fuerte">
              {titulo}
            </h3>
            {detalle && <p className="mt-0.5 text-xs text-texto">{detalle}</p>}
          </div>
        </div>
      ))}
    </section>
  );
}
