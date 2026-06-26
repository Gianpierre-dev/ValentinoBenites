// Helper de subida a Wasabi para scripts de datos (migración / carga inicial).
// Reusa las mismas variables que el StorageService de la app. Las fotos NO viven
// en el repositorio: se suben a Wasabi y la URL (del proxy del backend) queda en
// la base de datos como fuente de verdad.

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

const BUCKET = process.env.WASABI_BUCKET ?? '';
const PREFIX = (process.env.WASABI_PREFIX ?? '').replace(/^\/+|\/+$/g, '');
const API_PUBLIC_URL = (process.env.API_PUBLIC_URL ?? 'http://localhost:4024').replace(
  /\/+$/,
  '',
);

function crearCliente(): S3Client {
  const accessKeyId = process.env.WASABI_ACCESS_KEY ?? '';
  const secretAccessKey = process.env.WASABI_SECRET_KEY ?? '';
  if (!BUCKET || !accessKeyId || !secretAccessKey) {
    throw new Error('Faltan variables WASABI_* para subir fotos.');
  }
  return new S3Client({
    endpoint: process.env.WASABI_ENDPOINT ?? '',
    region: process.env.WASABI_REGION ?? '',
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

const cliente = crearCliente();

/**
 * Sube un buffer de imagen a Wasabi y devuelve la URL pública (proxy del backend).
 * El objeto queda privado en el bucket; se sirve por GET /api/storage/archivo/:filename.
 */
export async function subirFotoAWasabi(
  buffer: Buffer,
  extension = '.jpg',
  contentType = 'image/jpeg',
): Promise<string> {
  const filename = `${randomUUID()}${extension}`;
  const base = `productos/${filename}`;
  const key = PREFIX ? `${PREFIX}/${base}` : base;

  await cliente.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentDisposition: 'inline',
    }),
  );

  return `${API_PUBLIC_URL}/api/storage/archivo/${filename}`;
}
