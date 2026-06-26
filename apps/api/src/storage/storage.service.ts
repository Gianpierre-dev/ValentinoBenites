import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { detectarMimeReal, EXTENSION_POR_MIME } from './storage.config';

export interface ArchivoSubido {
  url: string;
}

export interface ArchivoDescarga {
  cuerpo: Readable;
  contentType: string;
}

// Filename = un solo segmento (uuid.ext). No puede contener "/" ni "..", así que
// es imposible salir de la carpeta del proyecto hacia otros datos del bucket.
const FILENAME_SEGURO = /^[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly cliente: S3Client | null;
  private readonly endpoint: string;
  private readonly region: string;
  private readonly bucket: string;
  // Carpeta (prefijo) dentro del bucket. Permite aislar los archivos de este
  // proyecto y migrar a otro bucket/carpeta cambiando solo esta variable.
  private readonly prefijo: string;
  private readonly apiPublicUrl: string;

  constructor(private readonly config: ConfigService) {
    this.endpoint = this.config.get<string>('WASABI_ENDPOINT') ?? '';
    this.region = this.config.get<string>('WASABI_REGION') ?? '';
    this.bucket = this.config.get<string>('WASABI_BUCKET') ?? '';
    // Sin barras al inicio/fin para construir keys limpias.
    this.prefijo = (this.config.get<string>('WASABI_PREFIX') ?? '').replace(/^\/+|\/+$/g, '');
    // URL pública del propio backend: las imágenes se sirven por proxy desde
    // aquí (el bucket no permite acceso público directo).
    this.apiPublicUrl = (
      this.config.get<string>('API_PUBLIC_URL') ?? 'http://localhost:4024'
    ).replace(/\/+$/, '');
    const accessKey = this.config.get<string>('WASABI_ACCESS_KEY') ?? '';
    const secretKey = this.config.get<string>('WASABI_SECRET_KEY') ?? '';

    if (this.credencialesCompletas(accessKey, secretKey)) {
      this.cliente = new S3Client({
        endpoint: this.endpoint,
        region: this.region,
        credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
        forcePathStyle: true,
      });
    } else {
      this.cliente = null;
      this.logger.warn(
        'Credenciales WASABI_* incompletas. Las subidas devolveran una URL placeholder local.',
      );
    }
  }

  async subir(archivo: Express.Multer.File): Promise<ArchivoSubido> {
    // No se confía en archivo.mimetype (lo controla el cliente): se valida la
    // firma real del contenido y se deriva la extensión del MIME verificado.
    const mimeReal = detectarMimeReal(archivo.buffer);
    if (!mimeReal) {
      throw new BadRequestException(
        'El archivo no es una imagen válida (JPG, PNG o WebP).',
      );
    }

    const filename = `${randomUUID()}${EXTENSION_POR_MIME[mimeReal] ?? ''}`;

    if (!this.cliente) {
      this.logger.warn(
        `Subida simulada para "${archivo.originalname}". Configura WASABI_* para subir a Wasabi.`,
      );
      return { url: `/uploads/placeholder/${filename}` };
    }

    // El objeto queda PRIVADO (el bucket no permite acceso público). Se sirve por
    // el proxy GET /api/storage/archivo/:filename, restringido a esta carpeta.
    await this.cliente.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.claveDe(filename),
        Body: archivo.buffer,
        ContentType: mimeReal,
        ContentDisposition: 'inline',
      }),
    );

    return { url: `${this.apiPublicUrl}/api/storage/archivo/${filename}` };
  }

  /** Descarga un archivo por su filename para servirlo vía proxy. */
  async obtener(filename: string): Promise<ArchivoDescarga> {
    if (!FILENAME_SEGURO.test(filename)) {
      throw new BadRequestException('Nombre de archivo inválido.');
    }
    if (!this.cliente) {
      throw new NotFoundException('Almacenamiento no configurado.');
    }

    try {
      const respuesta = await this.cliente.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: this.claveDe(filename) }),
      );
      return {
        cuerpo: respuesta.Body as Readable,
        contentType: respuesta.ContentType ?? 'application/octet-stream',
      };
    } catch {
      throw new NotFoundException('Archivo no encontrado.');
    }
  }

  private credencialesCompletas(accessKey: string, secretKey: string): boolean {
    return Boolean(
      this.endpoint && this.region && this.bucket && accessKey && secretKey,
    );
  }

  // Clave completa en el bucket. La carpeta es fija; solo varía el filename
  // (validado), por lo que nunca se accede fuera de la carpeta del proyecto.
  private claveDe(filename: string): string {
    const base = `productos/${filename}`;
    return this.prefijo ? `${this.prefijo}/${base}` : base;
  }
}
