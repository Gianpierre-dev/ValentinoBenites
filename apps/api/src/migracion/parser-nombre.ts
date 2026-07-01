import {
  COLOR_POR_DEFECTO,
  DICCIONARIO_COLORES,
  normalizarTexto,
} from './diccionario-colores';

export interface NombreParseado {
  /** Modelo derivado (nombre sin el color final). */
  modelo: string;
  /** Color canonico reconocido, o `Único` si no se reconocio. */
  color: string;
  /**
   * true cuando el parser NO reconocio un color y propone que un humano revise.
   * El parser PROPONE, nunca fuerza: ningun color se aplica sin revision.
   */
  requiereRevision: boolean;
}

// Mapa normalizado -> forma canonica, ordenado por cantidad de palabras (desc)
// para matchear el sufijo mas largo primero ("Azul Marino" antes que "Azul").
const COLORES_ORDENADOS = [...DICCIONARIO_COLORES].sort(
  (a, b) => b.split(' ').length - a.split(' ').length,
);

/**
 * Deriva { modelo, color } de un nombre de producto plano.
 *
 * Heuristica: se intenta reconocer un color en el SUFIJO del nombre (una o dos
 * palabras finales) contra el diccionario. Si matchea, el color se separa y el
 * resto queda como modelo. Si no matchea (o el final es un calificativo como
 * "Grande"/"II"), se marca `requiereRevision` y el color queda como `Único`.
 */
export function parsearNombre(nombre: string): NombreParseado {
  const palabras = nombre.trim().split(/\s+/);

  for (const color of COLORES_ORDENADOS) {
    const cantidad = color.split(' ').length;
    if (cantidad >= palabras.length) {
      // El color no puede ocupar todo el nombre: debe quedar modelo.
      continue;
    }
    const sufijo = palabras.slice(-cantidad).join(' ');
    if (normalizarTexto(sufijo) === normalizarTexto(color)) {
      return {
        modelo: palabras.slice(0, palabras.length - cantidad).join(' '),
        color,
        requiereRevision: false,
      };
    }
  }

  return {
    modelo: nombre.trim(),
    color: COLOR_POR_DEFECTO,
    requiereRevision: true,
  };
}
