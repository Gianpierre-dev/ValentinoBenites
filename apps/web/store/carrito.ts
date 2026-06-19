/**
 * Store del carrito de compras (Zustand) persistido en localStorage.
 * Guarda lo minimo del producto para mostrar el carrito sin volver a llamar a la API,
 * pero el total final del pedido lo recalcula el backend al crear el pedido.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Producto } from "@/lib/tipos";
import { precioVigente } from "@/lib/utilidades";

/** Linea del carrito: datos minimos del producto + cantidad elegida. */
export interface LineaCarrito {
  productoId: string;
  slug: string;
  nombre: string;
  precioUnitario: number;
  imagenUrl: string | null;
  stock: number;
  cantidad: number;
}

interface EstadoCarrito {
  lineas: LineaCarrito[];
  agregar: (producto: Producto, cantidad?: number) => void;
  quitar: (productoId: string) => void;
  cambiarCantidad: (productoId: string, cantidad: number) => void;
  vaciar: () => void;
  /** Total monetario del carrito (referencial; el backend recalcula al crear el pedido). */
  total: () => number;
  /** Cantidad total de unidades (para el contador del header). */
  cantidadTotal: () => number;
}

const CLAVE_PERSISTENCIA = "fabiola.carrito";

function recortarAlStock(cantidad: number, stock: number): number {
  if (cantidad < 1) return 1;
  if (stock > 0 && cantidad > stock) return stock;
  return cantidad;
}

export const useCarrito = create<EstadoCarrito>()(
  persist(
    (set, get) => ({
      lineas: [],

      agregar: (producto, cantidad = 1) => {
        const precioUnitario = precioVigente(producto.precio, producto.precioOferta);
        const imagenUrl = producto.imagenes?.[0]?.url ?? null;

        set((estado) => {
          const existente = estado.lineas.find((l) => l.productoId === producto.id);

          if (existente) {
            const nuevaCantidad = recortarAlStock(
              existente.cantidad + cantidad,
              producto.stock,
            );
            return {
              lineas: estado.lineas.map((l) =>
                l.productoId === producto.id ? { ...l, cantidad: nuevaCantidad } : l,
              ),
            };
          }

          const nuevaLinea: LineaCarrito = {
            productoId: producto.id,
            slug: producto.slug,
            nombre: producto.nombre,
            precioUnitario,
            imagenUrl,
            stock: producto.stock,
            cantidad: recortarAlStock(cantidad, producto.stock),
          };
          return { lineas: [...estado.lineas, nuevaLinea] };
        });
      },

      quitar: (productoId) =>
        set((estado) => ({
          lineas: estado.lineas.filter((l) => l.productoId !== productoId),
        })),

      cambiarCantidad: (productoId, cantidad) =>
        set((estado) => ({
          lineas: estado.lineas.map((l) =>
            l.productoId === productoId
              ? { ...l, cantidad: recortarAlStock(cantidad, l.stock) }
              : l,
          ),
        })),

      vaciar: () => set({ lineas: [] }),

      total: () =>
        get().lineas.reduce((suma, l) => suma + l.precioUnitario * l.cantidad, 0),

      cantidadTotal: () => get().lineas.reduce((suma, l) => suma + l.cantidad, 0),
    }),
    {
      name: CLAVE_PERSISTENCIA,
      partialize: (estado) => ({ lineas: estado.lineas }),
    },
  ),
);
