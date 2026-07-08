import { Prisma } from '@prisma/client';
import {
  imagenesDeVariante,
  precioEfectivoVariante,
} from '../variantes/variantes.helpers';

type Decimal = Prisma.Decimal;

export interface ImagenLike {
  url: string;
  orden: number;
}

export interface VarianteLike {
  activo: boolean;
  precio: Decimal | null;
  precioOferta: Decimal | null;
  imagenes: ImagenLike[];
}

export interface CategoriaLike {
  nombre: string;
  slug: string;
}

export interface ProductoLike<V extends VarianteLike> {
  precio: Decimal;
  precioOferta: Decimal | null;
  imagenes: ImagenLike[];
  variantes: V[];
  // Categoria completa que llega del include de Prisma; el serializer la reduce
  // al par { nombre, slug } que consume el front (chip de categoria).
  categoria?: (CategoriaLike & Record<string, unknown>) | null;
}

/**
 * Serializa un producto para la lectura publica: expone solo las variantes
 * activas y resuelve, del lado del serializer (no en la base de datos):
 *  - `imagenesEfectivas`: fotos de la variante con fallback al modelo.
 *  - `precioEfectivo` / `precioOfertaEfectivo`: precio segun la regla de
 *    resolucion (override de la variante -> precio base del producto), para que
 *    el front NO tenga que duplicar la cadena de fallback.
 */
export function serializarProductoPublico<
  V extends VarianteLike,
  P extends ProductoLike<V>,
>(producto: P) {
  const variantesActivas = producto.variantes
    .filter((variante) => variante.activo)
    .map((variante) => ({
      ...variante,
      imagenesEfectivas: imagenesDeVariante(variante, producto),
      precioEfectivo: precioEfectivoVariante(variante, producto),
      // Oferta efectiva: override de la variante primero, luego la del modelo.
      // Puede ser null cuando no hay oferta vigente en ningun nivel.
      precioOfertaEfectivo:
        variante.precioOferta ?? producto.precioOferta ?? null,
    }));

  // Reducimos la categoria al par { nombre, slug }: el front solo necesita eso
  // para el chip y el enlace; no exponemos columnas internas (id, orden, etc.).
  const categoria = producto.categoria
    ? { nombre: producto.categoria.nombre, slug: producto.categoria.slug }
    : null;

  return { ...producto, categoria, variantes: variantesActivas };
}
