import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';
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

  /**
   * Lista TODOS los productos (activos e inactivos) para el panel: la admin
   * decide aqui cuales trabajar. Los inactivos primero no; se ordenan por
   * nombre para una vista estable.
   */
  async listarTodosAdmin() {
    const productos = await this.prisma.producto.findMany({
      include: INCLUIR_RELACIONES,
      orderBy: { nombre: 'asc' },
    });
    return productos.map((producto) => serializarProductoPublico(producto));
  }

  /**
   * Genera el catalogo completo como Excel (.xlsx) para revisar offline. Es una
   * VISTA de solo lectura: la fuente de verdad del estado sigue siendo el panel.
   */
  async exportarExcel(): Promise<Buffer> {
    const productos = await this.prisma.producto.findMany({
      include: INCLUIR_RELACIONES,
      orderBy: [{ categoria: { nombre: 'asc' } }, { nombre: 'asc' }],
    });

    const libro = new ExcelJS.Workbook();
    libro.creator = 'Valentino Benites';
    const hoja = libro.addWorksheet('Catalogo', {
      views: [{ state: 'frozen', ySplit: 1 }], // fila de encabezado fija
    });

    hoja.columns = [
      { header: 'Foto', key: 'foto', width: 12 },
      { header: 'Producto', key: 'nombre', width: 34 },
      { header: 'Categoria', key: 'categoria', width: 16 },
      { header: 'Precio (S/)', key: 'precio', width: 12 },
      { header: 'Oferta (S/)', key: 'oferta', width: 12 },
      { header: 'Colores', key: 'colores', width: 30 },
      { header: 'Material', key: 'material', width: 26 },
      { header: 'Estado', key: 'estado', width: 12 },
    ];

    // Encabezado con color de marca.
    const cabecera = hoja.getRow(1);
    cabecera.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cabecera.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF7D2181' },
    };
    cabecera.alignment = { vertical: 'middle' };

    // Se descargan las portadas en paralelo ANTES de armar las filas; una
    // descarga fallida deja la celda sin foto pero no rompe el Excel.
    const portadas = await Promise.all(
      productos.map((p) => this.descargarPortada(p)),
    );

    productos.forEach((p, indice) => {
      const colores = p.variantes.map((v) => v.color).join(', ');
      const fila = hoja.addRow({
        foto: '',
        nombre: p.nombre,
        categoria: p.categoria?.nombre ?? 'Sin categoria',
        precio: Number(p.precio),
        oferta: p.precioOferta ? Number(p.precioOferta) : '',
        colores: colores || '—',
        material: p.material ?? '—',
        estado: p.activo ? 'Activo' : 'Inactivo',
      });
      fila.getCell('estado').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: p.activo ? 'FFD8F0DC' : 'FFEDEDED' },
      };

      const portada = portadas[indice];
      if (portada) {
        fila.height = 60; // deja lugar para la miniatura
        const idImagen = libro.addImage({
          buffer: portada.buffer as unknown as ExcelJS.Buffer,
          extension: portada.extension,
        });
        // Ancla la miniatura a la celda "foto" (columna 0, fila = indice+1).
        hoja.addImage(idImagen, {
          tl: { col: 0.1, row: indice + 1.1 },
          ext: { width: 70, height: 70 },
        });
      }
    });

    // Filtros automaticos sobre todo el rango con datos.
    hoja.autoFilter = { from: 'A1', to: `H${productos.length + 1}` };

    const buffer = await libro.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Descarga la foto de portada de un producto (la del modelo o, si no tiene,
   * la de su primera variante) para embeberla en el Excel. Devuelve null si no
   * hay foto o si la descarga falla, para que el export nunca se caiga por esto.
   */
  private async descargarPortada(
    producto: Prisma.ProductoGetPayload<{ include: typeof INCLUIR_RELACIONES }>,
  ): Promise<{ buffer: Buffer; extension: 'jpeg' | 'png' } | null> {
    const url =
      producto.imagenes[0]?.url ?? producto.variantes[0]?.imagenes[0]?.url;
    if (!url) return null;
    try {
      const respuesta = await fetch(url);
      if (!respuesta.ok) return null;
      const buffer = Buffer.from(await respuesta.arrayBuffer());
      const extension = /\.png($|\?)/i.test(url) ? 'png' : 'jpeg';
      return { buffer, extension };
    } catch {
      return null;
    }
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
