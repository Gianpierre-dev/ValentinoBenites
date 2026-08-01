import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Healthcheck del servicio. Railway lo consulta tras cada deploy para marcar
 * el contenedor como sano (railway.json -> healthcheckPath); sin esta señal la
 * plataforma a veces marca FAILED deploys que arrancaron bien. Verifica ademas
 * la conexion a la base: un API sin base no esta "sano".
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async verificar() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  }
}
