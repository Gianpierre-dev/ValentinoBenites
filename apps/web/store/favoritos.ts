/**
 * Store de favoritos (Zustand) persistido en localStorage.
 * Guarda un snapshot minimo del producto para listar los favoritos sin volver
 * a llamar a la API; el precio mostrado es referencial y el vigente se ve al
 * entrar al detalle del producto.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Producto } from "@/lib/tipos";

/** Item de favoritos: datos minimos para la tarjeta del listado. */
export interface ItemFavorito {
  productoId: string;
  slug: string;
  nombre: string;
  precio: number;
  precioOferta: number | null;
  imagenUrl: string | null;
}

interface EstadoFavoritos {
  items: ItemFavorito[];
  /** Marca el producto como favorito, o lo desmarca si ya lo era. */
  alternar: (producto: Producto) => void;
  quitar: (productoId: string) => void;
  esFavorito: (productoId: string) => boolean;
  /** Cantidad de favoritos (para el contador del header). */
  cantidad: () => number;
}

const CLAVE_PERSISTENCIA = "fabiola.favoritos";

export const useFavoritos = create<EstadoFavoritos>()(
  persist(
    (set, get) => ({
      items: [],

      alternar: (producto) =>
        set((estado) => {
          const yaEsFavorito = estado.items.some(
            (item) => item.productoId === producto.id,
          );
          if (yaEsFavorito) {
            return {
              items: estado.items.filter(
                (item) => item.productoId !== producto.id,
              ),
            };
          }

          const nuevo: ItemFavorito = {
            productoId: producto.id,
            slug: producto.slug,
            nombre: producto.nombre,
            precio: producto.precio,
            precioOferta: producto.precioOferta,
            // Portada: foto del modelo o, si las fotos viven en las variantes,
            // la primera foto efectiva de la primera variante.
            imagenUrl:
              producto.imagenes?.[0]?.url ??
              producto.variantes?.[0]?.imagenesEfectivas?.[0]?.url ??
              null,
          };
          return { items: [...estado.items, nuevo] };
        }),

      quitar: (productoId) =>
        set((estado) => ({
          items: estado.items.filter((item) => item.productoId !== productoId),
        })),

      esFavorito: (productoId) =>
        get().items.some((item) => item.productoId === productoId),

      cantidad: () => get().items.length,
    }),
    {
      name: CLAVE_PERSISTENCIA,
      partialize: (estado) => ({ items: estado.items }),
    },
  ),
);
