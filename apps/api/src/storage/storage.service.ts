import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { detectarMimeReal, EXTENSION_POR_MIME } from './storage.config';

export interface ArchivoSubido {
  url: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly cliente: S3Client | null;
  private readonly endpoint: string;
  private readonly region: string;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.endpoint = this.config.get<string>('WASABI_ENDPOINT') ?? '';
    this.region = this.config.get<string>('WASABI_REGION') ?? '';
    this.bucket = this.config.get<string>('WASABI_BUCKET') ?? '';
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

    const nombre = this.construirNombre(mimeReal);

    if (!this.cliente) {
      this.logger.warn(
        `Subida simulada para "${archivo.originalname}". Configura WASABI_* para subir a Wasabi.`,
      );
      return { url: `/uploads/placeholder/${nombre}` };
    }

    // ACL public-read es intencional para fotos de catálogo (deben verse sin
    // autenticación). Los comprobantes de pago deberían migrar a objetos
    // privados + URLs firmadas en Fase 2 (ver ESTADO.md).
    await this.cliente.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: nombre,
        Body: archivo.buffer,
        ContentType: mimeReal,
        ContentDisposition: 'inline',
        ACL: 'public-read',
      }),
    );

    return { url: `${this.endpoint}/${this.bucket}/${nombre}` };
  }

  private credencialesCompletas(accessKey: string, secretKey: string): boolean {
    return Boolean(
      this.endpoint && this.region && this.bucket && accessKey && secretKey,
    );
  }

  private construirNombre(mimeReal: string): string {
    const extension = EXTENSION_POR_MIME[mimeReal] ?? '';
    return `productos/${randomUUID()}${extension}`;
  }
}
