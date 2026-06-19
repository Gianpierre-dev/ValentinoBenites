import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

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
    const nombre = this.construirNombre(archivo.originalname);

    if (!this.cliente) {
      this.logger.warn(
        `Subida simulada para "${archivo.originalname}". Configura WASABI_* para subir a Wasabi.`,
      );
      return { url: `/uploads/placeholder/${nombre}` };
    }

    await this.cliente.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: nombre,
        Body: archivo.buffer,
        ContentType: archivo.mimetype,
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

  private construirNombre(nombreOriginal: string): string {
    const extension = nombreOriginal.includes('.')
      ? nombreOriginal.slice(nombreOriginal.lastIndexOf('.'))
      : '';
    return `productos/${randomUUID()}${extension}`;
  }
}
