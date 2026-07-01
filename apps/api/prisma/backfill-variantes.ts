// BACKFILL M1 — variante 1:1 por producto (NO destructivo, idempotente).
//
// Por cada Producto que AUN no tiene ninguna Variante, crea UNA Variante con el
// color derivado del nombre por el parser (`src/migracion/parser-nombre`). No
// borra nada, no modifica el Producto, no mueve imagenes (la Variante hereda las
// fotos del modelo por el fallback del serializer). La Variante inicial deja el
// precio en null para heredar el precio del modelo.
//
// Idempotente: si un Producto ya tiene variantes, se omite. Correr el script dos
// veces no crea duplicados.
//
// SEGURIDAD: BLOQUEADO en produccion (sin override). Este backfill es solo para
// entornos LOCAL/staging. En prod la carga se hace revisada desde el admin.
//
// Uso: pnpm --filter api exec tsx prisma/backfill-variantes.ts

import { PrismaClient } from '@prisma/client';
import { parsearNombre } from '../src/migracion/parser-nombre';

const prisma = new PrismaClient();

function verificarEntornoSeguro(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Backfill de variantes BLOQUEADO en produccion. Este script es solo para ' +
        'entornos LOCAL/staging. La migracion de datos de prod se hace revisada ' +
        'desde el admin (Fase M2), nunca automatica.',
    );
  }
}

async function main(): Promise<void> {
  verificarEntornoSeguro();

  const productos = await prisma.producto.findMany({
    include: { _count: { select: { variantes: true } } },
    orderBy: { nombre: 'asc' },
  });

  let creadas = 0;
  let omitidos = 0;
  const paraRevisar: string[] = [];

  for (const producto of productos) {
    if (producto._count.variantes > 0) {
      omitidos += 1;
      continue; // Idempotencia: ya tiene variantes, no se toca.
    }

    const { color, requiereRevision } = parsearNombre(producto.nombre);
    await prisma.variante.create({
      data: {
        productoId: producto.id,
        color,
        orden: 0,
        // precio null => hereda el precio del modelo (Producto).
      },
    });
    creadas += 1;
    if (requiereRevision) {
      paraRevisar.push(`${producto.nombre} -> color propuesto "${color}"`);
    }
  }

  console.log(`Backfill completado. Variantes creadas: ${creadas}.`);
  console.log(`Productos omitidos (ya tenian variantes): ${omitidos}.`);
  if (paraRevisar.length > 0) {
    console.log(
      `\n${paraRevisar.length} producto(s) sin color reconocible (revisar en admin):`,
    );
    for (const linea of paraRevisar) {
      console.log(`  - ${linea}`);
    }
  }
}

main()
  .catch((error) => {
    console.error('Error en el backfill de variantes:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
