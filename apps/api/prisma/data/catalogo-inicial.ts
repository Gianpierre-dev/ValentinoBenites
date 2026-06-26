// DATOS del catálogo inicial de Valentino Benites (separados de la lógica).
// Esto es la "carga inicial": una foto de arranque del catálogo. NO es la fuente
// de verdad en operación — en producción, la fuente de verdad es la base de datos
// y la clienta gestiona todo desde el panel admin.
//
// NOMBRES y PRECIOS son estimados/placeholder, ajustables desde el panel.
// Las fotos viven en apps/web/public/productos (foto-01.jpg .. foto-50.jpg).
// TODO (Wasabi): migrar las fotos a storage gestionado para que la clienta las
// suba/cambie desde el panel sin depender del repositorio.

export interface ProductoInicial {
  nombre: string;
  foto: number; // índice de foto-NN.jpg
  precio: number;
  oferta?: number;
  destacado?: boolean;
}

export const CONFIGURACION_INICIAL = {
  whatsapp: '51999999999',
  instagram: 'valentinobenites.pe',
  facebook: 'valentinobenites',
} as const;

export const CATALOGO_INICIAL: ProductoInicial[] = [
  { nombre: 'Bandolera Animal Print Gris', foto: 1, precio: 79.9, destacado: true },
  { nombre: 'Bandolera Andina Multicolor', foto: 2, precio: 84.9, destacado: true },
  { nombre: 'Bandolera Andina Vino', foto: 3, precio: 84.9 },
  { nombre: 'Bandolera Étnica Rosa', foto: 4, precio: 82.9 },
  { nombre: 'Bandolera Andina Fucsia', foto: 5, precio: 84.9, oferta: 69.9 },
  { nombre: 'Bandolera Étnica Camel', foto: 6, precio: 82.9 },
  { nombre: 'Bandolera Clásica Camel', foto: 7, precio: 75.9 },
  { nombre: 'Bandolera Andina Turquesa', foto: 8, precio: 84.9, destacado: true },
  { nombre: 'Bandolera Étnica Verde', foto: 9, precio: 82.9 },
  { nombre: 'Bandolera Casual Beige', foto: 10, precio: 72.9 },
  { nombre: 'Bandolera Andina Morada', foto: 11, precio: 84.9 },
  { nombre: 'Bandolera Étnica Azul', foto: 12, precio: 82.9, oferta: 67.9 },
  { nombre: 'Bandolera Clásica Negra', foto: 13, precio: 75.9, destacado: true },
  { nombre: 'Bandolera Urbana Gris', foto: 14, precio: 74.9 },
  { nombre: 'Bandolera Casual Marrón', foto: 15, precio: 72.9 },
  { nombre: 'Bandolera Andina Coral', foto: 16, precio: 84.9 },
  { nombre: 'Bandolera Clásica Azul Marino', foto: 17, precio: 75.9 },
  { nombre: 'Bandolera Étnica Naranja', foto: 18, precio: 82.9 },
  { nombre: 'Bandolera Casual Negra', foto: 19, precio: 72.9 },
  { nombre: 'Bandolera Bicolor Azul Beige', foto: 20, precio: 78.9, destacado: true },
  { nombre: 'Bandolera Andina Cielo', foto: 21, precio: 84.9 },
  { nombre: 'Bandolera Clásica Camel II', foto: 22, precio: 75.9 },
  { nombre: 'Bandolera Urbana Negra', foto: 23, precio: 74.9, oferta: 59.9 },
  { nombre: 'Bandolera Casual Arena', foto: 24, precio: 72.9 },
  { nombre: 'Bandolera Étnica Berenjena', foto: 25, precio: 82.9 },
  { nombre: 'Bandolera Clásica Taupe', foto: 26, precio: 75.9 },
  { nombre: 'Bandolera Bicolor Marrón', foto: 27, precio: 78.9 },
  { nombre: 'Bandolera Casual Cemento', foto: 28, precio: 72.9 },
  { nombre: 'Bandolera Urbana Camel', foto: 29, precio: 74.9 },
  { nombre: 'Bandolera Clásica Arena', foto: 30, precio: 75.9 },
  { nombre: 'Bandolera Casual Oliva', foto: 31, precio: 72.9 },
  { nombre: 'Bandolera Urbana Marrón', foto: 32, precio: 74.9 },
  { nombre: 'Bandolera Clásica Perla', foto: 33, precio: 75.9 },
  { nombre: 'Bandolera Casual Café', foto: 34, precio: 72.9, oferta: 58.9 },
  { nombre: 'Bandolera Urbana Beige', foto: 35, precio: 74.9 },
  { nombre: 'Bandolera Clásica Chocolate', foto: 36, precio: 75.9 },
  { nombre: 'Bandolera Casual Tabaco', foto: 37, precio: 72.9 },
  { nombre: 'Cartera Tote Andina Grande', foto: 38, precio: 139.9, destacado: true },
  { nombre: 'Cartera Tote Étnica Multicolor', foto: 39, precio: 139.9 },
  { nombre: 'Cartera Shopper Andina', foto: 40, precio: 129.9, destacado: true },
  { nombre: 'Cartera Tote Azteca', foto: 41, precio: 139.9 },
  { nombre: 'Cartera Shopper Étnica', foto: 42, precio: 129.9, oferta: 109.9 },
  { nombre: 'Cartera Tote Andina Vino', foto: 43, precio: 139.9 },
  { nombre: 'Cartera Shopper Multicolor', foto: 44, precio: 129.9 },
  { nombre: 'Cartera Tote Étnica Camel', foto: 45, precio: 139.9, destacado: true },
  { nombre: 'Cartera Shopper Azteca', foto: 46, precio: 129.9 },
  { nombre: 'Cartera Tote Andina Turquesa', foto: 47, precio: 139.9 },
  { nombre: 'Cartera Shopper Andina Coral', foto: 48, precio: 129.9 },
  { nombre: 'Cartera Tote Étnica Grande II', foto: 49, precio: 139.9, oferta: 115.9 },
  { nombre: 'Cartera Shopper Étnica Azul', foto: 50, precio: 129.9 },
];

import { resolve } from 'node:path';

// Ruta del archivo fuente de la foto (carpeta local, fuera del repo). Solo se usa
// para la carga inicial: el script lee el archivo y lo SUBE a Wasabi. Las fotos
// no viven en el repositorio.
export function rutaFotoFuente(n: number): string {
  return resolve(
    process.cwd(),
    '../../fotos-productos',
    `foto-${String(n).padStart(2, '0')}.jpg`,
  );
}

export function generarSlug(texto: string, indice: number): string {
  const base = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${base}-${indice}`;
}
