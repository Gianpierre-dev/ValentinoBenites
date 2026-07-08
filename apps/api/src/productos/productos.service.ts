import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto';
import { FiltrarProductosDto } from './dto/filtrar-productos.dto';
import { serializarProductoPublico } from './productos.serializer';

const INCLUIR_RELACIONES = {
  categoria: true,
  imagenes: { orderBy: { orden: 'asc' as const } },
  variantes: {
    where: { activo: true },
    orderBy: { orden: 'asc' as const },
    include: { imagenes: { orderBy: { orden: 'asc' as const } } },
  },
};

@Injectable()
export class ProductosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtros: FiltrarProductosDto) {
    const where: Prisma.ProductoWhereInput = { activo: true };

    if (filtros.categoria) {
      where.categoria = { slug: filtros.categoria };
    }

    if (filtros.destacados) {
      where.destacado = true;
    }

    if (filtros.q) {
      where.nombre = { contains: filtros.q, mode: 'insensitive' };
    }

    // Rango de precio sobre el precio base del modelo. Cada extremo es opcional:
    // solo agregamos las claves que llegan para no forzar un rango cerrado.
    if (filtros.precioMin !== undefined || filtros.precioMax !== undefined) {
      const rango: Prisma.DecimalFilter = {};
      if (filtros.precioMin !== undefined) {
        rango.gte = filtros.precioMin;
      }
      if (filtros.precioMax !== undefined) {
        rango.lte = filtros.precioMax;
      }
      where.precio = rango;
    }

    const productos = await this.prisma.producto.findMany({
      where,
      include: INCLUIR_RELACIONES,
      orderBy: { creadoEn: 'desc' },
    });

    // Contrato simetrico con la ficha: el catalogo tambien trae
    // imagenesEfectivas + precioEfectivo resueltos por el serializer.
    return productos.map((producto) => serializarProductoPublico(producto));
  }

  async obtenerPorSlug(slug: string) {
    const producto = await this.prisma.producto.findUnique({
      where: { slug },
      include: INCLUIR_RELACIONES,
    });

    if (!producto) {
      throw new NotFoundException('El producto no existe.');
    }

    return serializarProductoPublico(producto);
  }

  async crear(dto: CrearProductoDto) {
    if (dto.categoriaId) {
      await this.validarCategoria(dto.categoriaId);
    }
    const { imagenes, ...datos } = dto;

    try {
      return await this.prisma.producto.create({
        data: {
          ...datos,
          imagenes: imagenes?.length
            ? { create: imagenes.map((img) => ({ ...img })) }
            : undefined,
        },
        include: INCLUIR_RELACIONES,
      });
    } catch (error) {
      this.manejarSlugDuplicado(error);
      throw error;
    }
  }

  async actualizar(id: string, dto: ActualizarProductoDto) {
    await this.obtenerOFallar(id);

    if (dto.categoriaId) {
      await this.validarCategoria(dto.categoriaId);
    }

    const { imagenes, ...datos } = dto;

    try {
      return await this.prisma.producto.update({
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
    } catch (error) {
      this.manejarSlugDuplicado(error);
      throw error;
    }
  }

  async eliminar(id: string) {
    await this.obtenerOFallar(id);
    await this.prisma.producto.delete({ where: { id } });
    return { eliminado: true };
  }

  private async obtenerOFallar(id: string) {
    const producto = await this.prisma.producto.findUnique({ where: { id } });
    if (!producto) {
      throw new NotFoundException('El producto no existe.');
    }
    return producto;
  }

  private async validarCategoria(categoriaId: string): Promise<void> {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id: categoriaId },
    });
    if (!categoria) {
      throw new BadRequestException('La categoria indicada no existe.');
    }
  }

  private manejarSlugDuplicado(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Ya existe un producto con ese slug.');
    }
  }
}
