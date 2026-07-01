import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearVarianteDto } from './dto/crear-variante.dto';
import { ActualizarVarianteDto } from './dto/actualizar-variante.dto';
import { AgregarImagenVarianteDto } from './dto/agregar-imagen-variante.dto';

const INCLUIR_RELACIONES = {
  imagenes: { orderBy: { orden: 'asc' as const } },
};

@Injectable()
export class VariantesService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(productoId: string, dto: CrearVarianteDto) {
    await this.obtenerProductoOFallar(productoId);
    const { imagenes, ...datos } = dto;

    return this.prisma.variante.create({
      data: {
        ...datos,
        productoId,
        imagenes: imagenes?.length
          ? { create: imagenes.map((img) => ({ ...img })) }
          : undefined,
      },
      include: INCLUIR_RELACIONES,
    });
  }

  async actualizar(id: string, dto: ActualizarVarianteDto) {
    await this.obtenerVarianteOFallar(id);
    const { imagenes, ...datos } = dto;

    return this.prisma.variante.update({
      where: { id },
      data: {
        ...datos,
        imagenes: imagenes
          ? {
              deleteMany: {},
              create: imagenes.map((img) => ({ ...img })),
            }
          : undefined,
      },
      include: INCLUIR_RELACIONES,
    });
  }

  /**
   * Baja logica: nunca se hace hard-delete porque la variante puede estar
   * referenciada por items de pedidos historicos. Se marca activo=false.
   */
  async eliminar(id: string) {
    await this.obtenerVarianteOFallar(id);
    return this.prisma.variante.update({
      where: { id },
      data: { activo: false },
    });
  }

  async agregarImagen(varianteId: string, dto: AgregarImagenVarianteDto) {
    await this.obtenerVarianteOFallar(varianteId);
    return this.prisma.imagenVariante.create({
      data: { ...dto, varianteId },
    });
  }

  async eliminarImagen(imagenId: string) {
    const imagen = await this.prisma.imagenVariante.findUnique({
      where: { id: imagenId },
    });
    if (!imagen) {
      throw new NotFoundException('La imagen de variante no existe.');
    }
    await this.prisma.imagenVariante.delete({ where: { id: imagenId } });
    return { eliminada: true };
  }

  private async obtenerProductoOFallar(productoId: string) {
    const producto = await this.prisma.producto.findUnique({
      where: { id: productoId },
    });
    if (!producto) {
      throw new NotFoundException('El producto no existe.');
    }
    return producto;
  }

  private async obtenerVarianteOFallar(id: string) {
    const variante = await this.prisma.variante.findUnique({ where: { id } });
    if (!variante) {
      throw new NotFoundException('La variante no existe.');
    }
    return variante;
  }
}
