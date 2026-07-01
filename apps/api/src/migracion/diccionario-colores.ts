/**
 * Diccionario de colores conocidos (formaliza T1.1). Se construyo a partir de los
 * nombres reales de `prisma/data/catalogo-inicial.ts`, donde hoy cada color es un
 * Producto separado (ej. "Bandolera Andina Vino").
 *
 * Cada entrada es la etiqueta CANONICA del color (con acentos, casing correcto).
 * El parser normaliza (minusculas, sin acentos) para comparar, pero devuelve esta
 * forma canonica. Los colores de dos palabras se listan para poder matchear el
 * sufijo mas largo primero (ej. "Azul Marino" antes que "Azul").
 */
export const DICCIONARIO_COLORES: readonly string[] = [
  // Dos palabras (deben evaluarse antes que las de una palabra).
  'Azul Marino',
  'Azul Beige',
  // Una palabra.
  'Multicolor',
  'Gris',
  'Vino',
  'Rosa',
  'Fucsia',
  'Camel',
  'Turquesa',
  'Verde',
  'Beige',
  'Morada',
  'Azul',
  'Negra',
  'Marrón',
  'Coral',
  'Naranja',
  'Cielo',
  'Arena',
  'Berenjena',
  'Taupe',
  'Cemento',
  'Perla',
  'Café',
  'Chocolate',
  'Tabaco',
  'Oliva',
];

/** Color asignado cuando el parser no reconoce un color en el nombre. */
export const COLOR_POR_DEFECTO = 'Único';

/** Normaliza para comparar: minusculas, sin acentos, sin espacios extremos. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
