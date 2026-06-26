import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StorageService } from './storage.service';
import { TIPOS_IMAGEN_PERMITIDOS, TAMANO_MAXIMO_BYTES } from './storage.config';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('archivo', {
      limits: { fileSize: TAMANO_MAXIMO_BYTES, files: 1 },
      fileFilter: (_req, archivo, callback) => {
        if (!TIPOS_IMAGEN_PERMITIDOS.includes(archivo.mimetype)) {
          callback(
            new BadRequestException(
              'Solo se permiten imágenes JPG, PNG o WebP.',
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  subir(@UploadedFile() archivo: Express.Multer.File) {
    if (!archivo) {
      throw new BadRequestException('No se recibio ningun archivo.');
    }
    return this.storageService.subir(archivo);
  }

  /**
   * Proxy público de imágenes: sirve un archivo de la carpeta del proyecto en
   * Wasabi. Es público (las fotos del catálogo se ven sin login) pero restringido
   * a esta carpeta (el filename no puede contener "/" ni "..").
   */
  @Get('archivo/:filename')
  async servir(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    const { cuerpo, contentType } = await this.storageService.obtener(filename);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    cuerpo.pipe(res);
  }
}
