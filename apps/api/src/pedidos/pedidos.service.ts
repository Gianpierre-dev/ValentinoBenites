import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CrearPedidoDto } from './dto/crear-pedido.dto';
import { ActualizarEstadoDto } from './dto/actualizar-estado.dto';
import { precioEfectivoVariante } from '../variantes/variantes.helpers';
import { transicionPermitida } from './maquina-estados';

const INCLUIR_ITEMS = {
  items: { include: { producto: { include: { imagenes: true } } } },
};

interface LineaCalculada {
  productoId: string;
  varianteId: string;
  nombreProducto: string;
  colorElegido: string;
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
        // El estado inicial (PENDIENTE_PAGO) lo fija el default del schema.
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
    if (!transicionPermitida(pedido.estado, dto.estado)) {
      throw new BadRequestException(
        `No se puede pasar de ${pedido.estado} a ${dto.estado}.`,
      );
    }
    return this.prisma.pedido.update({
      where: { id },
      data: { estado: dto.estado },
      include: INCLUIR_ITEMS,
    });
  }

  /**
   * Construye las lineas del pedido leyendo la Variante (unidad comprable) y su
   * producto (modelo). El precio efectivo se resuelve del lado del servidor y se
   * captura un snapshot inmutable (nombre del modelo + color elegido). Modelo
   * hecho a pedido: NO hay validacion ni descuento de inventario.
   */
  private async calcularLineas(dto: CrearPedidoDto): Promise<LineaCalculada[]> {
    const ids = dto.items.map((item) => item.varianteId);
    const variantes = await this.prisma.variante.findMany({
      where: { id: { in: ids }, activo: true },
      include: { producto: true },
    });
    const porId = new Map(variantes.map((v) => [v.id, v]));

    return dto.items.map((item) => {
      const variante = porId.get(item.varianteId);
      if (!variante) {
        throw new BadRequestException(
          `La variante ${item.varianteId} no esta disponible.`,
        );
      }

      const precioUnitario = precioEfectivoVariante(
        variante,
        variante.producto,
      );
      const subtotal = precioUnitario.mul(item.cantidad);

      return {
        productoId: variante.productoId,
        varianteId: variante.id,
        nombreProducto: variante.producto.nombre,
        colorElegido: variante.color,
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
