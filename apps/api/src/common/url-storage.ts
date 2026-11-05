import { registerDecorator, type ValidationOptions } from 'class-validator';

/** Origen por defecto del backend cuando API_PUBLIC_URL no está definida (local). */
const ORIGEN_POR_DEFECTO = 'http://localhost:4024';

/** Ruta del proxy de storage: `/api/storage/archivo/<archivo>`. */
const RUTA_ARCHIVO = /^\/api\/storage\/archivo\/[A-Za-z0-9._-]+$/;

function origenDelStorage(): string {
  return new URL(process.env.API_PUBLIC_URL ?? ORIGEN_POR_DEFECTO).origin;
}

/**
 * true si la URL apunta a un archivo de NUESTRO proxy de storage: mismo origen
 * (protocolo + host + puerto) que API_PUBLIC_URL y ruta del proxy. Anclar solo
 * la ruta no alcanza: `https://dominio-ajeno/api/storage/archivo/x` también la
 * cumple (comprobante falso alojado afuera, o un fetch del servidor hacia afuera).
 */
export function esUrlDeStorage(url: string): boolean {
  let destino: URL;
  try {
    destino = new URL(url);
  } catch {
    return false;
  }
  return (
    destino.origin === origenDelStorage() &&
    RUTA_ARCHIVO.test(destino.pathname) &&
    destino.search === '' &&
    destino.hash === ''
  );
}

/**
 * Nombre del archivo (uuid.ext) de una URL de NUESTRO storage, o null si la URL
 * no es del proxy. Es la clave con la que se registra el comprobante.
 */
export function archivoDeUrlStorage(url: string): string | null {
  if (!esUrlDeStorage(url)) return null;
  return new URL(url).pathname.split('/').pop() ?? null;
}

/** Decorador de class-validator basado en esUrlDeStorage. */
export function EsUrlDeStorage(opciones?: ValidationOptions) {
  return (objeto: object, propiedad: string): void => {
    registerDecorator({
      name: 'esUrlDeStorage',
      target: objeto.constructor,
      propertyName: propiedad,
      options: opciones,
      validator: {
        validate: (valor: unknown) =>
          typeof valor === 'string' && esUrlDeStorage(valor),
      },
    });
  };
}
