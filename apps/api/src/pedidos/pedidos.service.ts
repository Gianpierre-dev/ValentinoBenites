import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CrearPedidoDto } from './dto/crear-pedido.dto';
import { ActualizarEstadoDto } from './dto/actualizar-estado.dto';

const INCLUIR_ITEMS = {
  items: { include: { producto: { include: { imagenes: true } } } },
};

interface LineaCalculada {
  productoId: string;
  nombreProducto: string;
  precioUnitario: Prisma.Decimal;
  cantidad: number;
  subtotal: Prisma.Decimal;
}

@Injectable()
export class PedidosService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CrearPedidoDto) {
    const lineas = await this.calcularLineas(dto);
    const total = lineas.reduce(
      (acumulado, linea) => acumulado.plus(linea.subtotal),
      new Prisma.Decimal(0),
    );
    const codigo = await this.generarCodigoUnico();

    return this.prisma.pedido.create({
      data: {
        codigo,
        nombreCliente: dto.nombreCliente,
        telefono: dto.telefono,
        metodoPago: dto.metodoPago,
        comprobanteUrl: dto.comprobanteUrl,
        total,
        items: { create: lineas },
      },
      include: INCLUIR_ITEMS,
    });
  }

  listar() {
    return this.prisma.pedido.findMany({
      include: INCLUIR_ITEMS,
      orderBy: { creadoEn: 'desc' },
    });
  }

  async actualizarEstado(id: string, dto: ActualizarEstadoDto) {
    const pedido = await this.prisma.pedido.findUnique({ where: { id } });
    if (!pedido) {
      throw new BadRequestException('El pedido no existe.');
    }
    return this.prisma.pedido.update({
      where: { id },
      data: { estado: dto.estado },
      include: INCLUIR_ITEMS,
    });
  }

  /**
   * Construye las lineas del pedido leyendo precios reales de la base.
   * Usa precioOferta cuando esta definido. Nunca confia en montos del cliente.
   */
  private async calcularLineas(dto: CrearPedidoDto): Promise<LineaCalculada[]> {
    const ids = dto.items.map((item) => item.productoId);
    const productos = await this.prisma.producto.findMany({
      where: { id: { in: ids }, activo: true },
    });
    const porId = new Map(productos.map((p) => [p.id, p]));

    return dto.items.map((item) => {
      const producto = porId.get(item.productoId);
      if (!producto) {
        throw new BadRequestException(
          `El producto ${item.productoId} no esta disponible.`,
        );
      }

      const precioUnitario = producto.precioOferta ?? producto.precio;
      const subtotal = precioUnitario.mul(item.cantidad);

      return {
        productoId: producto.id,
        nombreProducto: producto.nombre,
        precioUnitario,
        cantidad: item.cantidad,
        subtotal,
      };
    });
  }

  private async generarCodigoUnico(): Promise<string> {
    const anio = new Date().getFullYear();
    for (let intento = 0; intento < 5; intento += 1) {
      const aleatorio = Math.floor(1000 + Math.random() * 9000);
      const codigo = `FAB-${anio}-${aleatorio}`;
      const existente = await this.prisma.pedido.findUnique({
        where: { codigo },
      });
      if (!existente) {
        return codigo;
      }
    }
    return `FAB-${anio}-${Date.now()}`;
  }
}
