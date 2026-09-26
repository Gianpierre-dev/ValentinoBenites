import { BadRequestException, Injectable } from '@nestjs/common';
import { EstadoPedido, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CANTIDAD_MAXIMA_POR_LINEA,
  CotizarPedidoDto,
  CrearPedidoDto,
  ItemPedidoDto,
} from './dto/crear-pedido.dto';
import { ActualizarEstadoDto } from './dto/actualizar-estado.dto';
import { ActualizarEnvioDto } from './dto/actualizar-envio.dto';
import { precioEfectivoVariante } from '../variantes/variantes.helpers';
import { transicionPermitida } from './maquina-estados';
import { METODO_WHATSAPP } from './metodos-pago';

// Estados terminales/despachados: ya no se puede tocar el envio del pedido.
const ESTADOS_ENVIO_CERRADO: EstadoPedido[] = [
  EstadoPedido.ENVIADO,
  EstadoPedido.CANCELADO,
  EstadoPedido.RECHAZADO,
];

const INCLUIR_ITEMS = {
  items: { include: { producto: { include: { imagenes: true } } } },
};

/** Snapshot de color para una linea agregada sin variante (multi-color). */
const COLOR_A_COORDINAR = 'A coordinar';

/** Zona horaria del negocio: el año del codigo de pedido es el de Lima. */
const ZONA_HORARIA_NEGOCIO = 'America/Lima';

const INTENTOS_CODIGO = 5;

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

/** Resultado de cotizar una linea del carrito contra la base. */
export interface LineaCotizada {
  varianteId: string | null;
  productoId: string | null;
  cantidad: number;
  disponible: boolean;
  // null cuando el id no existe en la base (no hay nombre que mostrar).
  nombreProducto: string | null;
  colorElegido: string | null;
  precioUnitario: Prisma.Decimal | null;
  subtotal: Prisma.Decimal | null;
}

export interface Cotizacion {
  lineas: LineaCotizada[];
  // Suma de las lineas disponibles.
  subtotal: Prisma.Decimal;
  // true si todas las lineas se pueden comprar y el medio de pago esta activo.
  disponible: boolean;
  metodoPagoDisponible: boolean;
}

type VarianteConProducto = Prisma.VarianteGetPayload<{
  include: { producto: true };
}>;

@Injectable()
export class PedidosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resuelve el carrito contra la base SIN crear nada: precios vigentes y que
   * lineas siguen disponibles. El checkout la usa antes de mostrar el QR, para
   * que el cliente pague exactamente lo que se va a registrar.
   */
  async cotizar(dto: CotizarPedidoDto): Promise<Cotizacion> {
    const metodoPagoDisponible = dto.billeteraId
      ? await this.billeteraActiva(dto.billeteraId)
      : true;
    const lineas = await this.cotizarLineas(dto.items);
    const subtotal = this.sumar(lineas.filter((linea) => linea.disponible));
    return {
      lineas,
      subtotal,
      disponible: metodoPagoDisponible && lineas.every((l) => l.disponible),
      metodoPagoDisponible,
    };
  }

  async crear(dto: CrearPedidoDto) {
    if (dto.claveIdempotencia) {
      const existente = await this.buscarPorClave(dto.claveIdempotencia);
      if (existente) return existente;
    }

    const metodoPago = await this.resolverMetodoPago(dto.billeteraId);
    const cotizadas = await this.cotizarLineas(dto.items);
    this.exigirDisponibles(cotizadas);
    const lineas = cotizadas.map((linea) => this.aLineaCalculada(linea));
    // subtotal = suma de productos. El envio (costoEnvio) se coordina despues
    // por WhatsApp y lo completa la admin; al crear, total = subtotal.
    const subtotal = this.sumar(cotizadas);

    // El codigo es aleatorio y la unicidad la garantiza el indice unico: ante una
    // colision (P2002 sobre `codigo`) se reintenta con otro codigo.
    for (let intento = 0; intento < INTENTOS_CODIGO; intento += 1) {
      try {
        return await this.prisma.pedido.create({
          data: {
            codigo: this.generarCodigo(),
            nombreCliente: dto.nombreCliente,
            telefono: dto.telefono,
            metodoPago,
            comprobanteUrl: dto.comprobanteUrl,
            ciudadEntrega: dto.ciudadEntrega?.trim() || null,
            subtotal,
            total: subtotal, // costoEnvio = 0 al crear; total = subtotal.
            consentimientoEn: new Date(),
            claveIdempotencia: dto.claveIdempotencia ?? null,
            // El estado inicial (PENDIENTE_PAGO) lo fija el default del schema.
            items: { create: lineas },
          },
          include: INCLUIR_ITEMS,
        });
      } catch (error) {
        const campo = this.campoDuplicado(error);
        if (campo === 'claveIdempotencia' && dto.claveIdempotencia) {
          // El mismo intento llegó en paralelo y el otro ganó: se devuelve ese.
          const existente = await this.buscarPorClave(dto.claveIdempotencia);
          if (existente) return existente;
        }
        if (campo === 'codigo') continue;
        throw error;
      }
    }
    throw new BadRequestException(
      'No se pudo generar un código de pedido. Intenta nuevamente.',
    );
  }

  listar() {
    return this.prisma.pedido.findMany({
      include: INCLUIR_ITEMS,
      orderBy: { creadoEn: 'desc' },
    });
  }

  async actualizarEstado(id: string, dto: ActualizarEstadoDto) {
    const pedido = await this.obtenerOFallar(id);
    if (!transicionPermitida(pedido.estado, dto.estado)) {
      throw new BadRequestException(
        `No se puede pasar de ${pedido.estado} a ${dto.estado}.`,
      );
    }
    // Actualizacion condicionada al estado leido: si otra accion cambio el
    // pedido entre la lectura y la escritura, no se pisa.
    const { count } = await this.prisma.pedido.updateMany({
      where: { id, estado: pedido.estado },
      data: { estado: dto.estado },
    });
    if (count === 0) {
      throw new BadRequestException(
        'El pedido cambió mientras lo editabas. Recarga la página e intenta de nuevo.',
      );
    }
    return this.prisma.pedido.findUniqueOrThrow({
      where: { id },
      include: INCLUIR_ITEMS,
    });
  }

  /**
   * Registra el envio coordinado por la admin: costo y direccion exacta. El
   * total se RECALCULA server-side como subtotal + costoEnvio, para que sea la
   * unica fuente de verdad. Solo tiene sentido mientras el pedido no se despacho
   * ni se cerro (los estados terminales no admiten cambios de envio).
   */
  async actualizarEnvio(id: string, dto: ActualizarEnvioDto) {
    const pedido = await this.obtenerOFallar(id);
    if (ESTADOS_ENVIO_CERRADO.includes(pedido.estado)) {
      throw new BadRequestException(
        `No se puede editar el envío de un pedido ${pedido.estado}.`,
      );
    }
    const costoEnvio = new Prisma.Decimal(dto.costoEnvio);
    const { count } = await this.prisma.pedido.updateMany({
      where: { id, estado: { notIn: ESTADOS_ENVIO_CERRADO } },
      data: {
        costoEnvio,
        direccionEntrega: dto.direccionEntrega?.trim() || null,
        total: pedido.subtotal.plus(costoEnvio),
      },
    });
    if (count === 0) {
      throw new BadRequestException(
        'El pedido ya no admite cambios de envío. Recarga la página.',
      );
    }
    return this.prisma.pedido.findUniqueOrThrow({
      where: { id },
      include: INCLUIR_ITEMS,
    });
  }

  private async obtenerOFallar(id: string) {
    const pedido = await this.prisma.pedido.findUnique({ where: { id } });
    if (!pedido) {
      throw new BadRequestException('El pedido no existe.');
    }
    return pedido;
  }

  private buscarPorClave(claveIdempotencia: string) {
    return this.prisma.pedido.findUnique({
      where: { claveIdempotencia },
      include: INCLUIR_ITEMS,
    });
  }

  /**
   * Resuelve el snapshot del metodo de pago: sin billeteraId el pedido se
   * coordina por WhatsApp; con billeteraId debe existir y estar activa (se
   * valida server-side porque el cliente es manipulable) y el snapshot es su
   * NOMBRE, para que el pedido sobreviva si la billetera cambia o se elimina.
   */
  private async resolverMetodoPago(billeteraId?: string): Promise<string> {
    if (!billeteraId) return METODO_WHATSAPP;

    const billetera = await this.prisma.billetera.findUnique({
      where: { id: billeteraId },
    });
    if (!billetera || !billetera.activo) {
      throw new BadRequestException(
        'Ese medio de pago ya no está disponible. Elige otro para continuar.',
      );
    }
    return billetera.nombre;
  }

  private async billeteraActiva(billeteraId: string): Promise<boolean> {
    const billetera = await this.prisma.billetera.findUnique({
      where: { id: billeteraId },
    });
    return Boolean(billetera?.activo);
  }

  /**
   * Agrupa lineas repetidas (misma variante, o mismo producto "a coordinar") y
   * las resuelve contra la base. Una linea esta disponible solo si su variante
   * Y su producto estan activos: desactivar un producto lo retira de la venta
   * aunque sus variantes sigan marcadas como activas.
   */
  private async cotizarLineas(
    items: ItemPedidoDto[],
  ): Promise<LineaCotizada[]> {
    const agrupadas = this.agruparItems(items);
    const varianteIds = agrupadas
      .filter((item) => item.varianteId)
      .map((item) => item.varianteId as string);
    const productoIds = agrupadas
      .filter((item) => !item.varianteId && item.productoId)
      .map((item) => item.productoId as string);

    const variantes = varianteIds.length
      ? await this.prisma.variante.findMany({
          where: { id: { in: varianteIds } },
          include: { producto: true },
        })
      : [];
    const porVariante = new Map(variantes.map((v) => [v.id, v]));

    const productos = productoIds.length
      ? await this.prisma.producto.findMany({
          where: { id: { in: productoIds } },
        })
      : [];
    const porProducto = new Map(productos.map((p) => [p.id, p]));

    return agrupadas.map((item) =>
      item.varianteId
        ? this.cotizarConColor(item, porVariante.get(item.varianteId))
        : this.cotizarACoordinar(
            item,
            porProducto.get(item.productoId as string),
          ),
    );
  }

  private agruparItems(items: ItemPedidoDto[]): ItemPedidoDto[] {
    const porClave = new Map<string, ItemPedidoDto>();
    for (const item of items) {
      const clave = item.varianteId
        ? `v:${item.varianteId}`
        : `p:${item.productoId}`;
      const previo = porClave.get(clave);
      porClave.set(
        clave,
        previo
          ? { ...previo, cantidad: previo.cantidad + item.cantidad }
          : { ...item },
      );
    }
    const agrupadas = [...porClave.values()];
    if (agrupadas.some((item) => item.cantidad > CANTIDAD_MAXIMA_POR_LINEA)) {
      throw new BadRequestException(
        `La cantidad por producto no puede superar ${CANTIDAD_MAXIMA_POR_LINEA}.`,
      );
    }
    return agrupadas;
  }

  /** Linea con color elegido: precio efectivo de la variante + snapshot de color. */
  private cotizarConColor(
    item: ItemPedidoDto,
    variante: VarianteConProducto | undefined,
  ): LineaCotizada {
    if (!variante) return this.lineaInexistente(item);

    const disponible = variante.activo && variante.producto.activo;
    const precioUnitario = precioEfectivoVariante(variante, variante.producto);
    return {
      varianteId: variante.id,
      productoId: variante.productoId,
      cantidad: item.cantidad,
      disponible,
      nombreProducto: variante.producto.nombre,
      colorElegido: variante.color,
      precioUnitario: disponible ? precioUnitario : null,
      subtotal: disponible ? precioUnitario.mul(item.cantidad) : null,
    };
  }

  /**
   * Linea "a coordinar": producto multi-color agregado sin color. El precio es
   * el base del modelo (oferta -> precio) y el color se define luego por WhatsApp.
   */
  private cotizarACoordinar(
    item: ItemPedidoDto,
    producto: Prisma.ProductoGetPayload<object> | undefined,
  ): LineaCotizada {
    if (!producto) return this.lineaInexistente(item);

    const precioUnitario = producto.precioOferta ?? producto.precio;
    return {
      varianteId: null,
      productoId: producto.id,
      cantidad: item.cantidad,
      disponible: producto.activo,
      nombreProducto: producto.nombre,
      colorElegido: COLOR_A_COORDINAR,
      precioUnitario: producto.activo ? precioUnitario : null,
      subtotal: producto.activo ? precioUnitario.mul(item.cantidad) : null,
    };
  }

  private lineaInexistente(item: ItemPedidoDto): LineaCotizada {
    return {
      varianteId: item.varianteId ?? null,
      productoId: item.productoId ?? null,
      cantidad: item.cantidad,
      disponible: false,
      nombreProducto: null,
      colorElegido: null,
      precioUnitario: null,
      subtotal: null,
    };
  }

  /** Rechaza el pedido nombrando los productos que ya no se venden. */
  private exigirDisponibles(lineas: LineaCotizada[]): void {
    const noDisponibles = lineas.filter((linea) => !linea.disponible);
    if (noDisponibles.length === 0) return;

    const nombres = noDisponibles
      .map((linea) => linea.nombreProducto)
      .filter((nombre): nombre is string => Boolean(nombre));
    throw new BadRequestException(
      nombres.length === noDisponibles.length
        ? `Estos productos ya no están disponibles: ${nombres.join(', ')}. Quítalos del carrito para continuar.`
        : 'Algunos productos de tu carrito ya no están disponibles. Quítalos del carrito para continuar.',
    );
  }

  private aLineaCalculada(linea: LineaCotizada): LineaCalculada {
    return {
      productoId: linea.productoId as string,
      varianteId: linea.varianteId,
      nombreProducto: linea.nombreProducto as string,
      colorElegido: linea.colorElegido as string,
      precioUnitario: linea.precioUnitario as Prisma.Decimal,
      cantidad: linea.cantidad,
      subtotal: linea.subtotal as Prisma.Decimal,
    };
  }

  private sumar(lineas: LineaCotizada[]): Prisma.Decimal {
    return lineas.reduce(
      (acumulado, linea) =>
        linea.subtotal ? acumulado.plus(linea.subtotal) : acumulado,
      new Prisma.Decimal(0),
    );
  }

  private generarCodigo(): string {
    const anio = new Intl.DateTimeFormat('es-PE', {
      timeZone: ZONA_HORARIA_NEGOCIO,
      year: 'numeric',
    }).format(new Date());
    const aleatorio = Math.floor(1000 + Math.random() * 9000);
    return `FAB-${anio}-${aleatorio}`;
  }

  /** Campo que violó un índice único (P2002), o null si es otro error. */
  private campoDuplicado(error: unknown): string | null {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== 'P2002'
    ) {
      return null;
    }
    const objetivo = error.meta?.target;
    const campos = Array.isArray(objetivo) ? objetivo : [String(objetivo)];
    if (campos.some((c) => String(c).includes('claveIdempotencia'))) {
      return 'claveIdempotencia';
    }
    if (campos.some((c) => String(c).includes('codigo'))) return 'codigo';
    return null;
  }
}
