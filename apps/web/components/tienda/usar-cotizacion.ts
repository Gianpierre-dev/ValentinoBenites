"use client";

import { useCallback, useEffect, useState } from "react";
import { cotizarPedido, ErrorApi } from "@/lib/api";
import type { Cotizacion, ItemPedidoEntrada } from "@/lib/tipos";
import { useCarrito, type LineaCarrito } from "@/store/carrito";

/** Espera antes de cotizar, para no llamar al servidor en cada clic de "+". */
const ESPERA_MS = 300;

interface ResultadoCotizacion {
  /** Firma del carrito que produjo este resultado. */
  firma: string;
  cotizacion: Cotizacion | null;
  error: string | null;
}

export interface EstadoCotizacion {
  /** Cotización vigente para el carrito actual; null mientras se calcula. */
  cotizacion: Cotizacion | null;
  cargando: boolean;
  error: string | null;
  /** Nombres de productos que se quitaron del carrito por no estar disponibles. */
  quitados: string[];
  /**
   * Vuelve a cotizar en el momento (antes de confirmar) y sincroniza el
   * carrito. Devuelve la cotización o lanza el error de la API.
   */
  refrescar: (billeteraId?: string) => Promise<Cotizacion>;
}

/** Con color elegido -> varianteId; "a coordinar" (sin variante) -> productoId. */
export function itemsDelCarrito(lineas: LineaCarrito[]): ItemPedidoEntrada[] {
  return lineas.map((linea) =>
    linea.varianteId
      ? { varianteId: linea.varianteId, cantidad: linea.cantidad }
      : { productoId: linea.productoId, cantidad: linea.cantidad },
  );
}

function firmaDe(lineas: LineaCarrito[]): string {
  return lineas.map((linea) => `${linea.clave}:${linea.cantidad}`).join("|");
}

/**
 * Mantiene el carrito alineado con el servidor mientras el cliente está en el
 * checkout: precios vigentes y productos que ya no se venden (se quitan y se
 * avisa). Así el monto que se muestra junto al QR es el que se registra.
 */
export function useCotizacion(lineas: LineaCarrito[]): EstadoCotizacion {
  const sincronizar = useCarrito((estado) => estado.sincronizarConCotizacion);
  const [resultado, setResultado] = useState<ResultadoCotizacion | null>(null);
  const [quitados, setQuitados] = useState<string[]>([]);
  const firma = firmaDe(lineas);

  const aplicar = useCallback(
    (cotizacion: Cotizacion) => {
      const retirados = sincronizar(cotizacion.lineas);
      if (retirados.length > 0) {
        setQuitados((previos) => [...new Set([...previos, ...retirados])]);
      }
    },
    [sincronizar],
  );

  useEffect(() => {
    if (firma === "") return;
    let vigente = true;
    const temporizador = setTimeout(() => {
      const items = itemsDelCarrito(useCarrito.getState().lineas);
      cotizarPedido({ items })
        .then((cotizacion) => {
          if (!vigente) return;
          setResultado({ firma, cotizacion, error: null });
          aplicar(cotizacion);
        })
        .catch((error: unknown) => {
          if (!vigente) return;
          setResultado({
            firma,
            cotizacion: null,
            error:
              error instanceof ErrorApi
                ? error.message
                : "No pudimos confirmar los precios de tu pedido.",
          });
        });
    }, ESPERA_MS);
    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [firma, aplicar]);

  const refrescar = useCallback(
    async (billeteraId?: string) => {
      const items = itemsDelCarrito(useCarrito.getState().lineas);
      const cotizacion = await cotizarPedido({ items, billeteraId });
      aplicar(cotizacion);
      setResultado({
        firma: firmaDe(useCarrito.getState().lineas),
        cotizacion,
        error: null,
      });
      return cotizacion;
    },
    [aplicar],
  );

  const vigente = resultado?.firma === firma ? resultado : null;
  return {
    cotizacion: vigente?.cotizacion ?? null,
    cargando: firma !== "" && vigente === null,
    error: vigente?.error ?? null,
    quitados,
    refrescar,
  };
}
