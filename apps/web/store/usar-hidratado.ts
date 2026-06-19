import { useSyncExternalStore } from "react";
import { useCarrito } from "./carrito";

const suscribir = (alCambiar: () => void) =>
  useCarrito.persist.onFinishHydration(alCambiar);

const obtenerEstado = () => useCarrito.persist.hasHydrated();

/**
 * Indica si el store persistido del carrito ya termino de hidratar desde
 * localStorage. En el servidor devuelve `false`, evitando desfases de
 * hidratacion al renderizar datos dependientes del cliente (ej. el contador).
 */
export function useHidratado(): boolean {
  return useSyncExternalStore(suscribir, obtenerEstado, () => false);
}
