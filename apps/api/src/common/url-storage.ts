/**
 * Una URL de nuestro proxy de storage:
 * `https://<host>/api/storage/archivo/<archivo>`. Se ancla al PATH del proxy,
 * no al host (que varia por entorno), para aceptar solo archivos propios y
 * rechazar dominios ajenos o IPs internas (defensa anti-SSRF).
 */
export const RUTA_STORAGE =
  /^https:\/\/[^/]+\/api\/storage\/archivo\/[A-Za-z0-9._-]+$/;

/** true si la URL apunta a un archivo de nuestro propio storage. */
export function esUrlDeStorage(url: string): boolean {
  return RUTA_STORAGE.test(url);
}
