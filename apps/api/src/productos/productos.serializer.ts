import { imagenesDeVariante } from '../variantes/variantes.helpers';

export interface ImagenLike {
  url: string;
  orden: number;
}

export interface VarianteLike {
  activo: boolean;
  imagenes: ImagenLike[];
}

export interface ProductoLike<V extends VarianteLike> {
  imagenes: ImagenLike[];
  variantes: V[];
}

/**
 * Serializa un producto para la lectura publica: expone solo las variantes
 * activas y resuelve las imagenes efectivas de cada una (fallback al modelo)
 * en el serializer, no en la base de datos.
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
    }));

  return { ...producto, variantes: variantesActivas };
}
