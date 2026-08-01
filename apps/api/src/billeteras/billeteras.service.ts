import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CrearBilleteraDto } from './dto/crear-billetera.dto';
import { ActualizarBilleteraDto } from './dto/actualizar-billetera.dto';

/**
 * Billeteras digitales de pago manual (Yape, Plin, Agora...). Son DATA, no
 * codigo: la admin las crea desde el panel y el checkout las pinta dinamico.
 * El pedido guarda el NOMBRE como snapshot, por eso eliminar una billetera no
 * afecta pedidos historicos.
 */
@Injectable()
export class BilleterasService {
  constructor(private readonly prisma: PrismaService) {}

  /** Billeteras visibles en el checkout, en el orden definido por la admin. */
  listarActivas() {
    return this.prisma.billetera.findMany({
      where: { activo: true },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    });
  }

  /** Todas (incluye inactivas), para el panel admin. */
  listarTodas() {
    return this.prisma.billetera.findMany({
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    });
  }

  async crear(dto: CrearBilleteraDto) {
    try {
      return await this.prisma.billetera.create({
        data: {
          nombre: dto.nombre.trim(),
          slug: generarSlug(dto.nombre),
          instrucciones: dto.instrucciones?.trim() || null,
          qrUrl: dto.qrUrl ?? null,
          activo: dto.activo ?? true,
          orden: dto.orden ?? 0,
        },
      });
    } catch (error) {
      this.manejarDuplicado(error);
      throw error;
    }
  }

  async actualizar(id: string, dto: ActualizarBilleteraDto) {
    await this.obtenerOFallar(id);
    try {
      return await this.prisma.billetera.update({
        where: { id },
        data: {
          ...(dto.nombre !== undefined
            ? { nombre: dto.nombre.trim(), slug: generarSlug(dto.nombre) }
            : {}),
          ...(dto.instrucciones !== undefined
            ? { instrucciones: dto.instrucciones.trim() || null }
            : {}),
          ...(dto.qrUrl !== undefined ? { qrUrl: dto.qrUrl || null } : {}),
          ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
          ...(dto.orden !== undefined ? { orden: dto.orden } : {}),
        },
      });
    } catch (error) {
      this.manejarDuplicado(error);
      throw error;
    }
  }

  /** Hard delete: el pedido guarda snapshot del nombre, no una FK. */
  async eliminar(id: string) {
    await this.obtenerOFallar(id);
    await this.prisma.billetera.delete({ where: { id } });
    return { eliminado: true };
  }

  private async obtenerOFallar(id: string) {
    const billetera = await this.prisma.billetera.findUnique({ where: { id } });
    if (!billetera) {
      throw new NotFoundException('La billetera no existe.');
    }
    return billetera;
  }

  private manejarDuplicado(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Ya existe una billetera con ese nombre.');
    }
  }
}

/** Slug URL-safe derivado del nombre ("Banco de la Nación" -> "banco-de-la-nacion"). */
function generarSlug(nombre: string): string {
  return nombre
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
