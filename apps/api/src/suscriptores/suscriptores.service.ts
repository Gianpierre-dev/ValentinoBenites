import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CrearSuscriptorDto } from './dto/crear-suscriptor.dto';

@Injectable()
export class SuscriptoresService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra el email del newsletter. Idempotente: si el correo ya estaba
   * suscrito (P2002) se responde igual que un alta exitosa, sin revelar al
   * visitante si un email existe o no en la base.
   */
  async suscribir(dto: CrearSuscriptorDto) {
    const email = dto.email.trim().toLowerCase();
    try {
      await this.prisma.suscriptor.create({ data: { email } });
    } catch (error) {
      const duplicado =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002';
      if (!duplicado) throw error;
    }
    return { suscrito: true };
  }

  listar() {
    return this.prisma.suscriptor.findMany({ orderBy: { creadoEn: 'desc' } });
  }

  /**
   * Da de baja a un suscriptor. Es el mecanismo de baja que exige la Ley 28493
   * (antispam): la persona lo solicita por nuestros canales y la admin lo
   * ejecuta desde el panel. Hard-delete a proposito: dar de baja significa
   * dejar de conservar el dato, no marcarlo.
   */
  async eliminar(id: string) {
    const suscriptor = await this.prisma.suscriptor.findUnique({
      where: { id },
    });
    if (!suscriptor) {
      throw new NotFoundException('El suscriptor no existe.');
    }
    await this.prisma.suscriptor.delete({ where: { id } });
    return { eliminado: true };
  }
}
