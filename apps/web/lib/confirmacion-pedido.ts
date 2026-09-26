/**
 * Datos de la pantalla de confirmación de un pedido. Se guardan en la sesión
 * del navegador y el código queda en la URL (?pedido=...), para que recargar
 * la página no haga perder el código ni las instrucciones al cliente.
 */
export interface ConfirmacionPedido {
  codigo: string;
  total: number;
  /** Nombre del medio de pago ("WhatsApp", "Yape", "Plin"...). */
  metodoPago: string;
  telefono: string;
  /** Enlace para abrir el chat del pedido (solo pedidos por WhatsApp). */
  enlaceWhatsApp: string | null;
}

const PREFIJO = "fabiola.pedido.";
export const PARAMETRO_PEDIDO = "pedido";

export function guardarConfirmacion(confirmacion: ConfirmacionPedido): void {
  try {
    window.sessionStorage.setItem(
      `${PREFIJO}${confirmacion.codigo}`,
      JSON.stringify(confirmacion),
    );
  } catch {
    // Sin sessionStorage (modo privado estricto) la confirmación se ve igual;
    // solo no sobrevive a una recarga.
  }
}

/** Confirmación del pedido indicado en la URL, si existe en esta sesión. */
export function leerConfirmacionDeUrl(): ConfirmacionPedido | null {
  if (typeof window === "undefined") return null;
  const codigo = new URLSearchParams(window.location.search).get(PARAMETRO_PEDIDO);
  if (!codigo) return null;
  try {
    const guardada = window.sessionStorage.getItem(`${PREFIJO}${codigo}`);
    return guardada ? (JSON.parse(guardada) as ConfirmacionPedido) : null;
  } catch {
    return null;
  }
}
