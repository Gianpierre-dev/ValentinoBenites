import clsx, { type ClassValue } from "clsx";
import type { Producto, Variante } from "./tipos";

/** Une clases condicionales de Tailwind de forma legible. */
export function cn(...clases: ClassValue[]): string {
  return clsx(clases);
}

const FORMATEADOR_SOLES = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

/** Formatea un monto en soles peruanos (ej. "S/ 129.90"). */
export function formatearPrecio(monto: number): string {
  return FORMATEADOR_SOLES.format(monto);
}

/** Calcula el porcentaje de descuento entre el precio normal y el de oferta. */
export function calcularDescuento(precio: number, precioOferta: number | null): number | null {
  if (precioOferta === null || precioOferta >= precio || precio <= 0) return null;
  return Math.round(((precio - precioOferta) / precio) * 100);
}

/** Precio efectivo de venta: el de oferta si existe y es menor, si no el normal. */
export function precioVigente(precio: number, precioOferta: number | null): number {
  if (precioOferta !== null && precioOferta < precio) return precioOferta;
  return precio;
}

/** Precio de una variante listo para mostrar: precio final, precio tachado y % de descuento. */
export interface PrecioMostrable {
  /** Precio final a cobrar (ya considera la oferta). */
  precioFinal: number;
  /** Precio normal tachado; null si la variante no esta en oferta. */
  precioAntes: number | null;
  /** Porcentaje de descuento; null si no hay oferta. */
  descuento: number | null;
}

/**
 * Resuelve el precio mostrable de una variante a partir de los campos efectivos
 * que expone el backend (`precioEfectivo`) y el precio base del modelo.
 */
export function precioMostrableVariante(
  variante: Variante,
  producto: Producto,
): PrecioMostrable {
  const precioFinal = variante.precioEfectivo;
  const precioBase = variante.precio ?? producto.precio;
  const enOferta = precioFinal < precioBase;

  return {
    precioFinal,
    precioAntes: enOferta ? precioBase : null,
    descuento: enOferta ? calcularDescuento(precioBase, precioFinal) : null,
  };
}
