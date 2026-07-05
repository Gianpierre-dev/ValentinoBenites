import { useSyncExternalStore } from "react";
import { useCarrito } from "./carrito";
import { useFavoritos } from "./favoritos";

const suscribirCarrito = (alCambiar: () => void) =>
  useCarrito.persist.onFinishHydration(alCambiar);

const obtenerEstadoCarrito = () => useCarrito.persist.hasHydrated();

/**
 * Indica si el store persistido del carrito ya termino de hidratar desde
 * localStorage. En el servidor devuelve `false`, evitando desfases de
 * hidratacion al renderizar datos dependientes del cliente (ej. el contador).
 */
export function useHidratado(): boolean {
  return useSyncExternalStore(suscribirCarrito, obtenerEstadoCarrito, () => false);
}

const suscribirFavoritos = (alCambiar: () => void) =>
  useFavoritos.persist.onFinishHydration(alCambiar);

const obtenerEstadoFavoritos = () => useFavoritos.persist.hasHydrated();

/**
 * Igual que `useHidratado` pero para el store de favoritos: cada store
 * persistido hidrata por separado, por eso cada uno tiene su hook.
 */
export function useHidratadoFavoritos(): boolean {
  return useSyncExternalStore(
    suscribirFavoritos,
    obtenerEstadoFavoritos,
    () => false,
  );
}
