import clsx, { type ClassValue } from "clsx";

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
