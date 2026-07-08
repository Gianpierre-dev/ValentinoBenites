import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';
import { ActualizarCategoriaDto } from './dto/actualizar-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  async listarActivas() {
    const categorias = await this.prisma.categoria.findMany({
      where: { activo: true },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true,
        nombre: true,
        slug: true,
        orden: true,
        activo: true,
        // Conteo filtrado: solo productos activos alimentan el "Bandoleras (12)".
        _count: { select: { productos: { where: { activo: true } } } },
      },
    });

    // Aplanamos el _count a un campo estable para el front; no exponemos la
    // forma interna del agregado de Prisma.
    return categorias.map(({ _count, ...categoria }) => ({
      ...categoria,
      cantidadProductos: _count.productos,
    }));
  }

  async crear(dto: CrearCategoriaDto) {
    try {
      return await this.prisma.categoria.create({ data: dto });
    } catch (error) {
      this.manejarSlugDuplicado(error);
      throw error;
    }
  }

  async actualizar(id: string, dto: ActualizarCategoriaDto) {
    await this.obtenerOFallar(id);
    try {
      return await this.prisma.categoria.update({ where: { id }, data: dto });
    } catch (error) {
      this.manejarSlugDuplicado(error);
      throw error;
    }
  }

  async eliminar(id: string) {
    await this.obtenerOFallar(id);
    await this.prisma.categoria.delete({ where: { id } });
    return { eliminado: true };
  }

  private async obtenerOFallar(id: string) {
    const categoria = await this.prisma.categoria.findUnique({ where: { id } });
    if (!categoria) {
      throw new NotFoundException('La categoria no existe.');
    }
    return categoria;
  }

  private manejarSlugDuplicado(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Ya existe una categoria con ese slug.');
    }
  }
}
