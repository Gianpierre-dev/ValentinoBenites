/**
 * Mantiene un store persistido igual en todas las pestañas abiertas. Sin esto,
 * una pestaña con datos viejos los vuelve a guardar al primer cambio y revive
 * lo que se borró en otra (por ejemplo, un carrito ya vaciado).
 */
export function sincronizarEntrePestanas(
  clavePersistencia: string,
  rehidratar: () => Promise<void> | void,
): void {
  if (typeof window === "undefined") return;
  window.addEventListener("storage", (evento) => {
    if (evento.key === clavePersistencia) void rehidratar();
  });
}
