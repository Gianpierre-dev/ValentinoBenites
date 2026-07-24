import { Injectable } from '@nestjs/common';
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
}
