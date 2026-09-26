/**
 * Store del carrito de compras (Zustand) persistido en localStorage.
 *
 * Una linea del carrito puede ser de dos tipos:
 * - Con color elegido: ligada a una VARIANTE (color). Dos colores del mismo
 *   modelo son lineas distintas. Su clave es el id de la variante.
 * - "A coordinar": ligada al PRODUCTO (modelo multi-color) sin color elegido; la
 *   clienta lo fabrica en el color que se defina luego por WhatsApp. Su clave es
 *   `coordinar:${productoId}` para que sea estable y no colisione con variantes.
 *
 * Guarda lo minimo para pintar el carrito sin volver a llamar a la API; el total
 * final del pedido lo recalcula el backend.
 *
 * Modelo hecho-a-pedido: no hay stock. La cantidad va de 1 a CANTIDAD_MAXIMA, el
 * mismo tope que aplica el backend por linea.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LineaCotizada, Producto, Variante } from "@/lib/tipos";
import { sincronizarEntrePestanas } from "./sincronizar-pestanas";

/** Snapshot de color para una linea agregada sin color (multi-color). */
export const COLOR_A_COORDINAR = "A coordinar";

/** Tope de unidades por linea: el mismo que valida el backend. */
export const CANTIDAD_MAXIMA = 999;

/** Linea del carrito: datos minimos para pintarla + cantidad. */
export interface LineaCarrito {
  /**
   * Identidad estable de la linea. Variante -> id de la variante;
   * "a coordinar" -> `coordinar:${productoId}`.
   */
  clave: string;
  /** id de la variante elegida, o null si la linea es "a coordinar". */
  varianteId: string | null;
  productoId: string;
  slug: string;
  /** Nombre del modelo (ej. "Bandolera Andina"). */
  nombre: string;
  /** Color elegido (ej. "Vino"), o "A coordinar" si se agrego sin color. */
  color: string;
  colorHex: string | null;
  /** Precio efectivo (de la variante o del producto) al agregar (referencial). */
  precioUnitario: number;
  imagenUrl: string | null;
  cantidad: number;
}

interface EstadoCarrito {
  lineas: LineaCarrito[];
  /** Si el panel lateral (drawer) del carrito esta visible. No se persiste. */
  abierto: boolean;
  /** Agrega un color concreto (variante) del producto. */
  agregar: (producto: Producto, variante: Variante, cantidad?: number) => void;
  /**
   * Agrega un producto multi-color SIN color elegido ("a coordinar"): entra al
   * carrito ligado al producto; el color se define en la ficha o por WhatsApp.
   */
  agregarSinColor: (producto: Producto, cantidad?: number) => void;
  quitar: (clave: string) => void;
  cambiarCantidad: (clave: string, cantidad: number) => void;
  vaciar: () => void;
  /**
   * Aplica la cotizacion del servidor: actualiza el precio de cada linea al
   * vigente y quita las que ya no se venden. Devuelve los nombres quitados.
   */
  sincronizarConCotizacion: (lineasCotizadas: LineaCotizada[]) => string[];
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

/** Clave de identidad de una linea "a coordinar" (ligada al producto). */
function claveCoordinar(productoId: string): string {
  return `coordinar:${productoId}`;
}

/** El precio efectivo del producto (modelo): oferta si hay, si no el base. */
function precioEfectivoProducto(producto: Producto): number {
  return producto.precioOferta ?? producto.precio;
}

/** La cantidad queda entre 1 y CANTIDAD_MAXIMA, y siempre entera. */
function normalizarCantidad(cantidad: number): number {
  if (!Number.isFinite(cantidad) || cantidad < 1) return 1;
  return Math.min(Math.floor(cantidad), CANTIDAD_MAXIMA);
}

/** Clave de la linea del carrito que corresponde a una linea cotizada. */
function claveDeCotizada(linea: LineaCotizada): string {
  return linea.varianteId ?? claveCoordinar(linea.productoId ?? "");
}

/**
 * Agrega una linea al estado o suma la cantidad si ya existe (por clave).
 * Centraliza la logica compartida entre `agregar` y `agregarSinColor`.
 */
function agregarLinea(
  lineas: LineaCarrito[],
  nueva: LineaCarrito,
): LineaCarrito[] {
  const existente = lineas.find((l) => l.clave === nueva.clave);
  if (existente) {
    return lineas.map((l) =>
      l.clave === nueva.clave
        ? { ...l, cantidad: normalizarCantidad(l.cantidad + nueva.cantidad) }
        : l,
    );
  }
  return [...lineas, nueva];
}

export const useCarrito = create<EstadoCarrito>()(
  persist(
    (set, get) => ({
      lineas: [],
      abierto: false,

      agregar: (producto, variante, cantidad = 1) => {
        const imagenUrl =
          variante.imagenesEfectivas?.[0]?.url ??
          producto.imagenes?.[0]?.url ??
          null;

        const nueva: LineaCarrito = {
          clave: variante.id,
          varianteId: variante.id,
          productoId: producto.id,
          slug: producto.slug,
          nombre: producto.nombre,
          color: variante.color,
          colorHex: variante.colorHex,
          precioUnitario: variante.precioEfectivo,
          imagenUrl,
          cantidad: normalizarCantidad(cantidad),
        };

        set((estado) => ({
          abierto: true,
          lineas: agregarLinea(estado.lineas, nueva),
        }));
      },

      agregarSinColor: (producto, cantidad = 1) => {
        const nueva: LineaCarrito = {
          clave: claveCoordinar(producto.id),
          varianteId: null,
          productoId: producto.id,
          slug: producto.slug,
          nombre: producto.nombre,
          color: COLOR_A_COORDINAR,
          colorHex: null,
          precioUnitario: precioEfectivoProducto(producto),
          imagenUrl: producto.imagenes?.[0]?.url ?? null,
          cantidad: normalizarCantidad(cantidad),
        };

        set((estado) => ({
          abierto: true,
          lineas: agregarLinea(estado.lineas, nueva),
        }));
      },

      quitar: (clave) =>
        set((estado) => ({
          lineas: estado.lineas.filter((l) => l.clave !== clave),
        })),

      cambiarCantidad: (clave, cantidad) =>
        set((estado) => ({
          lineas: estado.lineas.map((l) =>
            l.clave === clave
              ? { ...l, cantidad: normalizarCantidad(cantidad) }
              : l,
          ),
        })),

      vaciar: () => set({ lineas: [] }),

      sincronizarConCotizacion: (lineasCotizadas) => {
        const porClave = new Map(
          lineasCotizadas.map((linea) => [claveDeCotizada(linea), linea]),
        );
        const actuales = get().lineas;
        const quitadas: string[] = [];
        const lineas = actuales.flatMap((linea) => {
          const cotizada = porClave.get(linea.clave);
          if (!cotizada) return [linea];
          if (!cotizada.disponible || cotizada.precioUnitario === null) {
            quitadas.push(linea.nombre);
            return [];
          }
          return linea.precioUnitario === cotizada.precioUnitario
            ? [linea]
            : [{ ...linea, precioUnitario: cotizada.precioUnitario }];
        });
        const cambio =
          lineas.length !== actuales.length ||
          lineas.some((linea, i) => linea !== actuales[i]);
        if (cambio) set({ lineas });
        return quitadas;
      },

      abrir: () => set({ abierto: true }),

      cerrar: () => set({ abierto: false }),

      total: () =>
        get().lineas.reduce((suma, l) => suma + l.precioUnitario * l.cantidad, 0),

      cantidadTotal: () => get().lineas.reduce((suma, l) => suma + l.cantidad, 0),
    }),
    {
      name: CLAVE_PERSISTENCIA,
      // v3: la linea gano un campo `clave` para soportar lineas por variante y
      // lineas "a coordinar" (ligadas al producto). El shape viejo (indexado por
      // varianteId, sin clave) no es mapeable de forma fiable: se invalida limpio
      // y el cliente arranca con un carrito vacio.
      version: 3,
      migrate: () => ({ lineas: [] as LineaCarrito[] }),
      partialize: (estado) => ({ lineas: estado.lineas }),
    },
  ),
);

sincronizarEntrePestanas(CLAVE_PERSISTENCIA, () => useCarrito.persist.rehydrate());
