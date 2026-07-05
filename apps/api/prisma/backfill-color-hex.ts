// BACKFILL — colorHex de variantes (NO destructivo, idempotente).
//
// Rellena Variante.colorHex SOLO donde es null, usando un diccionario
// nombre -> hex con tonos realistas de cuero. Nunca pisa un hex ya cargado:
// lo que se ajusto desde el admin se respeta. Los nombres sin un tono unico
// mapeable ("Unico", "Multicolor", "Azul Beige") se omiten y se listan para
// carga manual; sus bolitas siguen usando la foto como fallback.
//
// Idempotente: correrlo dos veces no cambia nada (la segunda vez no encuentra
// variantes con colorHex null que esten en el diccionario).
//
// SEGURIDAD: por defecto corre en MODO SIMULACRO (muestra el plan, no escribe).
// Para escribir de verdad hay que pasar el flag explicito:
//
//   pnpm --filter api exec tsx prisma/backfill-color-hex.ts            (simulacro)
//   pnpm --filter api exec tsx prisma/backfill-color-hex.ts --aplicar  (escribe)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Tonos elegidos pensando en cuero sintetico, no en colores neon de paleta web. */
const HEX_POR_COLOR: Record<string, string> = {
  arena: '#D6BC94',
  azul: '#34558B',
  'azul marino': '#1F2A44',
  beige: '#D9C3A9',
  berenjena: '#4B2E4C',
  cafe: '#5D4037',
  camel: '#C19A6B',
  cemento: '#A3A09A',
  chocolate: '#4E342E',
  cielo: '#9CC3E5',
  coral: '#E76F51',
  fucsia: '#C2185B',
  gris: '#8E8E8E',
  marron: '#6B4226',
  morada: '#5E3A87',
  naranja: '#E07B39',
  negra: '#1A1A1A',
  negro: '#1A1A1A',
  oliva: '#708238',
  perla: '#EAE6DF',
  rosa: '#E7A1B0',
  tabaco: '#8A5A2B',
  taupe: '#8B7E74',
  turquesa: '#2FA8A0',
  verde: '#3E7C4F',
  vino: '#722F37',
};

/** Normaliza el nombre para buscar en el diccionario: minusculas y sin tildes. */
function claveDeColor(nombre: string): string {
  return nombre
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

async function main(): Promise<void> {
  const aplicar = process.argv.includes('--aplicar');
  console.log(aplicar ? '== MODO APLICAR ==' : '== MODO SIMULACRO (no escribe; usa --aplicar) ==');

  const pendientes = await prisma.variante.findMany({
    where: { colorHex: null },
    select: { id: true, color: true },
    orderBy: { color: 'asc' },
  });

  let actualizadas = 0;
  const plan = new Map<string, { hex: string; cantidad: number }>();
  const sinMapeo = new Map<string, number>();

  for (const variante of pendientes) {
    const hex = HEX_POR_COLOR[claveDeColor(variante.color)];
    if (!hex) {
      sinMapeo.set(variante.color, (sinMapeo.get(variante.color) ?? 0) + 1);
      continue;
    }

    const entrada = plan.get(variante.color) ?? { hex, cantidad: 0 };
    entrada.cantidad += 1;
    plan.set(variante.color, entrada);

    if (aplicar) {
      await prisma.variante.update({
        where: { id: variante.id },
        data: { colorHex: hex },
      });
      actualizadas += 1;
    }
  }

  console.log(`\nVariantes sin hex encontradas: ${pendientes.length}`);
  console.log('\nMapeo:');
  for (const [color, { hex, cantidad }] of [...plan.entries()].sort()) {
    console.log(`  ${color.padEnd(14)} -> ${hex}  (x${cantidad})`);
  }
  if (sinMapeo.size > 0) {
    console.log('\nOmitidas (cargar a mano desde el admin si se quiere un tono):');
    for (const [color, cantidad] of [...sinMapeo.entries()].sort()) {
      console.log(`  ${color}  (x${cantidad})`);
    }
  }
  console.log(
    aplicar
      ? `\nListo: ${actualizadas} variantes actualizadas.`
      : '\nSimulacro terminado: no se escribio nada.',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
