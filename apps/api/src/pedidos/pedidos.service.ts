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
  // null para lineas "a coordinar" (producto multi-color sin color elegido).
  varianteId: string | null;
  nombreProducto: string;
  colorElegido: string;
  precioUnitario: Prisma.Decimal;
  cantidad: number;
  subtotal: Prisma.Decimal;
}

/** Snapshot de color para una linea agregada sin variante (multi-color). */
const COLOR_A_COORDINAR = 'A coordinar';

@Injectable()
export class PedidosService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CrearPedidoDto) {
    const lineas = await this.calcularLineas(dto);
    const total = lineas.reduce(
      (acumulado, linea) => acumulado.plus(linea.subtotal),
      new Prisma.Decimal(0),
    );

    // SUG-01: el codigo unico se genera con una ventana de carrera entre el
    // chequeo de existencia y el create. Ante una colision real (P2002 sobre
    // `codigo`) reintentamos con un codigo nuevo en vez de propagar un 500 opaco.
    for (let intento = 0; intento < 5; intento += 1) {
      const codigo = await this.generarCodigoUnico();
      try {
        return await this.prisma.pedido.create({
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
      } catch (error) {
        if (this.esColisionDeCodigo(error) && intento < 4) {
          continue;
        }
        throw error;
      }
    }
    // Inalcanzable en la practica: el loop retorna o lanza antes de agotarse.
    throw new BadRequestException(
      'No se pudo generar un codigo de pedido unico. Intenta nuevamente.',
    );
  }

  private esColisionDeCodigo(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
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
    // Un item con varianteId es un color elegido; sin el (y con productoId) es
    // una linea "a coordinar" que se resuelve contra el producto (modelo).
    const varianteIds = dto.items
      .filter((item) => item.varianteId)
      .map((item) => item.varianteId as string);
    const productoIds = dto.items
      .filter((item) => !item.varianteId && item.productoId)
      .map((item) => item.productoId as string);

    const variantes = await this.prisma.variante.findMany({
      where: { id: { in: varianteIds }, activo: true },
      include: { producto: true },
    });
    const porVariante = new Map(variantes.map((v) => [v.id, v]));

    const productos = productoIds.length
      ? await this.prisma.producto.findMany({
          where: { id: { in: productoIds }, activo: true },
        })
      : [];
    const porProducto = new Map(productos.map((p) => [p.id, p]));

    return dto.items.map((item) => {
      if (item.varianteId) {
        return this.lineaConColor(item, porVariante);
      }
      return this.lineaACoordinar(item, porProducto);
    });
  }

  /** Linea con color elegido: precio efectivo de la variante + snapshot de color. */
  private lineaConColor(
    item: CrearPedidoDto['items'][number],
    porVariante: Map<
      string,
      Prisma.VarianteGetPayload<{ include: { producto: true } }>
    >,
  ): LineaCalculada {
    const variante = porVariante.get(item.varianteId as string);
    if (!variante) {
      throw new BadRequestException(
        `La variante ${item.varianteId} no esta disponible.`,
      );
    }

    const precioUnitario = precioEfectivoVariante(variante, variante.producto);
    return {
      productoId: variante.productoId,
      varianteId: variante.id,
      nombreProducto: variante.producto.nombre,
      colorElegido: variante.color,
      precioUnitario,
      cantidad: item.cantidad,
      subtotal: precioUnitario.mul(item.cantidad),
    };
  }

  /**
   * Linea "a coordinar": producto multi-color agregado sin color. El precio es
   * el base del modelo (oferta -> precio) y el color se define luego por WhatsApp.
   */
  private lineaACoordinar(
    item: CrearPedidoDto['items'][number],
    porProducto: Map<string, Prisma.ProductoGetPayload<object>>,
  ): LineaCalculada {
    const producto = porProducto.get(item.productoId as string);
    if (!producto) {
      throw new BadRequestException(
        `El producto ${item.productoId} no esta disponible.`,
      );
    }

    const precioUnitario = producto.precioOferta ?? producto.precio;
    return {
      productoId: producto.id,
      varianteId: null,
      nombreProducto: producto.nombre,
      colorElegido: COLOR_A_COORDINAR,
      precioUnitario,
      cantidad: item.cantidad,
      subtotal: precioUnitario.mul(item.cantidad),
    };
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
