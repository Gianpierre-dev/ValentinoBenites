import { Prisma } from '@prisma/client';

type Decimal = Prisma.Decimal;

interface PrecioVariante {
  precio: Decimal | null;
  precioOferta: Decimal | null;
}

interface PrecioProducto {
  precio: Decimal;
  precioOferta: Decimal | null;
}

/**
 * Precio efectivo de una variante segun la regla de resolucion del modelo:
 * override de la variante primero, luego el precio base del producto.
 * Orden: variante.precioOferta -> variante.precio -> producto.precioOferta -> producto.precio.
 */
export function precioEfectivoVariante(
  variante: PrecioVariante,
  producto: PrecioProducto,
): Decimal {
  return (
    variante.precioOferta ??
    variante.precio ??
    producto.precioOferta ??
    producto.precio
  );
}

/**
 * Imagenes efectivas de una variante: sus fotos propias si tiene alguna,
 * en caso contrario cae al fallback de las fotos del producto (modelo).
 */
export function imagenesDeVariante<TVariante, TProducto>(
  variante: { imagenes: TVariante[] },
  producto: { imagenes: TProducto[] },
): TVariante[] | TProducto[] {
  return variante.imagenes.length > 0 ? variante.imagenes : producto.imagenes;
}
