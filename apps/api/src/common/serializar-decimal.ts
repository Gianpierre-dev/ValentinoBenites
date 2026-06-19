import { Prisma } from '@prisma/client';

/**
 * Convierte recursivamente los Decimal de Prisma a number nativo.
 * Mantiene el resto de valores intactos. Se aplica antes de devolver
 * cualquier entidad con campos Decimal (precio, total, subtotal, etc.).
 */
export function serializarDecimal<T>(valor: T): T {
  if (valor === null || valor === undefined) {
    return valor;
  }

  if (valor instanceof Prisma.Decimal) {
    return valor.toNumber() as unknown as T;
  }

  if (valor instanceof Date) {
    return valor;
  }

  if (Array.isArray(valor)) {
    return valor.map((item) => serializarDecimal(item)) as unknown as T;
  }

  if (typeof valor === 'object') {
    const resultado: Record<string, unknown> = {};
    for (const [clave, contenido] of Object.entries(
      valor as Record<string, unknown>,
    )) {
      resultado[clave] = serializarDecimal(contenido);
    }
    return resultado as T;
  }

  return valor;
}
