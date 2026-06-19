import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarConfiguracionDto } from './dto/actualizar-configuracion.dto';

const WHATSAPP_POR_DEFECTO = '51999999999';

@Injectable()
export class ConfiguracionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Devuelve la fila unica de configuracion. La crea si aun no existe.
   */
  async obtener() {
    const existente = await this.prisma.configuracion.findFirst();
    if (existente) {
      return existente;
    }
    return this.prisma.configuracion.create({
      data: { whatsapp: WHATSAPP_POR_DEFECTO },
    });
  }

  async actualizar(dto: ActualizarConfiguracionDto) {
    const actual = await this.obtener();
    return this.prisma.configuracion.update({
      where: { id: actual.id },
      data: {
        whatsapp: dto.whatsapp,
        datosYape: dto.datosYape,
        datosPlin: dto.datosPlin,
        banners: dto.banners as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
