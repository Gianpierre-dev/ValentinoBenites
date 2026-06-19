// Configuración y validación de archivos para el módulo de storage.
// Centraliza el allowlist de imágenes para que controller y service lo compartan.

export const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5 MB

export const TIPOS_IMAGEN_PERMITIDOS: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const EXTENSION_POR_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

// Firma (magic bytes) de cada formato. No confiar en el mimetype declarado por
// el cliente: se valida el contenido real del archivo.
const FIRMAS: { mime: string; bytes: number[] }[] = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  // WebP: "RIFF"...."WEBP" (se valida RIFF y el marcador WEBP en offset 8).
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
];

/**
 * Devuelve el MIME real del buffer según sus magic bytes, o null si no coincide
 * con ningún formato permitido.
 */
export function detectarMimeReal(buffer: Buffer): string | null {
  for (const firma of FIRMAS) {
    const coincide = firma.bytes.every((byte, i) => buffer[i] === byte);
    if (!coincide) continue;
    if (firma.mime === 'image/webp') {
      const esWebp =
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50;
      if (!esWebp) continue;
    }
    return firma.mime;
  }
  return null;
}
