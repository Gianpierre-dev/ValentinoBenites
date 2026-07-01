/**
 * Store del carrito de compras (Zustand) persistido en localStorage.
 * La unidad del carrito es la VARIANTE (color) de un producto: dos colores del
 * mismo modelo son lineas distintas. Guarda lo minimo para pintar el carrito sin
 * volver a llamar a la API; el total final del pedido lo recalcula el backend.
 *
 * Modelo hecho-a-pedido: no hay stock ni topes de inventario (cantidad minima 1).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Producto, Variante } from "@/lib/tipos";

/** Linea del carrito: datos minimos de la variante elegida + cantidad. */
export interface LineaCarrito {
  /** Clave de la linea: id de la variante (color) elegida. */
  varianteId: string;
  productoId: string;
  slug: string;
  /** Nombre del modelo (ej. "Bandolera Andina"). */
  nombre: string;
  /** Color elegido (ej. "Vino"). */
  color: string;
  colorHex: string | null;
  /** Precio efectivo de la variante al momento de agregar (referencial). */
  precioUnitario: number;
  imagenUrl: string | null;
  cantidad: number;
}

interface EstadoCarrito {
  lineas: LineaCarrito[];
  /** Si el panel lateral (drawer) del carrito esta visible. No se persiste. */
  abierto: boolean;
  agregar: (producto: Producto, variante: Variante, cantidad?: number) => void;
  quitar: (varianteId: string) => void;
  cambiarCantidad: (varianteId: string, cantidad: number) => void;
  vaciar: () => void;
  /** Abre el panel lateral del carrito. */
  abrir: () => void;
  /** Cierra el panel lateral del carrito. */
  cerrar: () => void;
  /** Total monetario del carrito (referencial; el backend recalcula al crear el pedido). */
  total: () => number;
  /** Cantidad total de unidades (para el contador del header). */
  cantidadTotal: () => number;
}

const CLAVE_PERSISTENCIA = "fabiola.carrito";

/** La cantidad nunca baja de 1 (sin tope superior: hecho a pedido). */
function normalizarCantidad(cantidad: number): number {
  return cantidad < 1 ? 1 : cantidad;
}

export const useCarrito = create<EstadoCarrito>()(
  persist(
    (set, get) => ({
      lineas: [],
      abierto: false,

      agregar: (producto, variante, cantidad = 1) => {
        const precioUnitario = variante.precioEfectivo;
        const imagenUrl =
          variante.imagenesEfectivas?.[0]?.url ??
          producto.imagenes?.[0]?.url ??
          null;

        set((estado) => {
          const existente = estado.lineas.find(
            (l) => l.varianteId === variante.id,
          );

          if (existente) {
            const nuevaCantidad = normalizarCantidad(
              existente.cantidad + cantidad,
            );
            return {
              abierto: true,
              lineas: estado.lineas.map((l) =>
                l.varianteId === variante.id
                  ? { ...l, cantidad: nuevaCantidad }
                  : l,
              ),
            };
          }

          const nuevaLinea: LineaCarrito = {
            varianteId: variante.id,
            productoId: producto.id,
            slug: producto.slug,
            nombre: producto.nombre,
            color: variante.color,
            colorHex: variante.colorHex,
            precioUnitario,
            imagenUrl,
            cantidad: normalizarCantidad(cantidad),
          };
          return { abierto: true, lineas: [...estado.lineas, nuevaLinea] };
        });
      },

      quitar: (varianteId) =>
        set((estado) => ({
          lineas: estado.lineas.filter((l) => l.varianteId !== varianteId),
        })),

      cambiarCantidad: (varianteId, cantidad) =>
        set((estado) => ({
          lineas: estado.lineas.map((l) =>
            l.varianteId === varianteId
              ? { ...l, cantidad: normalizarCantidad(cantidad) }
              : l,
          ),
        })),

      vaciar: () => set({ lineas: [] }),

      abrir: () => set({ abierto: true }),

      cerrar: () => set({ abierto: false }),

      total: () =>
        get().lineas.reduce((suma, l) => suma + l.precioUnitario * l.cantidad, 0),

      cantidadTotal: () => get().lineas.reduce((suma, l) => suma + l.cantidad, 0),
    }),
    {
      name: CLAVE_PERSISTENCIA,
      // v2: el carrito paso de indexarse por productoId a varianteId. Las lineas
      // viejas no son mapeables de forma fiable (productoId -> varianteId), asi
      // que se invalidan limpio: el cliente arranca con un carrito vacio.
      version: 2,
      migrate: () => ({ lineas: [] as LineaCarrito[] }),
      partialize: (estado) => ({ lineas: estado.lineas }),
    },
  ),
);
