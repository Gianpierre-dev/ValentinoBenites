import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EstadoPedido, MetodoPago, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { transicionPermitida } from '../pedidos/maquina-estados';
import { GenerarTokenDto } from './dto/generar-token.dto';
import { CallbackIzipayDto } from './dto/callback-izipay.dto';

const PROVEEDOR_IZIPAY = 'IZIPAY';

/**
 * Modulo de pagos AISLADO (STUB de Izipay). El Pedido es payment-agnostic: este
 * servicio es el unico que conoce al proveedor y solo muta el estado del pedido
 * a traves de la maquina de estados existente.
 *
 * FAIL-CLOSED: en este cambio la integracion real NO existe. Para que un stub
 * sin validacion de firma NUNCA pueda marcar pedidos como pagados en un entorno
 * publico, ambos endpoints exigen el flag explicito `IZIPAY_STUB_HABILITADO`.
 * Si el flag no esta en 'true' se responde 503 (ServiceUnavailable).
 *
 * PUNTO DE ENGANCHE (integracion real, NO implementado en este cambio):
 *  - generarToken(): reemplazar el token stub por la llamada real a la API de
 *    Izipay (POST Charge/CreatePayment) usando las credenciales de `.env`
 *    (IZIPAY_USERNAME / IZIPAY_PASSWORD / IZIPAY_PUBLIC_KEY). El endpoint real
 *    devuelve un `formToken` que el front usa para renderizar el formulario.
 *  - procesarCallback(): antes de mutar el pedido se debe VALIDAR LA FIRMA del
 *    IPN (KR-Hash/HMAC con la clave de Izipay). Recien tras validar la firma se
 *    marca el pedido como PAGADO.
 */
@Injectable()
export class PagosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async generarToken(dto: GenerarTokenDto) {
    this.asegurarStubHabilitado();

    const pedido = await this.obtenerPedidoOFallar(dto.pedidoId);
    if (pedido.estado !== EstadoPedido.PENDIENTE_PAGO) {
      throw new BadRequestException(
        'Solo se puede generar el token de un pedido pendiente de pago.',
      );
    }

    // STUB: no se llama a la pasarela real. El formToken es un valor ficticio
    // trazable al pedido. Aqui ira el call real a la API de Izipay.
    return {
      formToken: `STUB-${pedido.id}-${Date.now()}`,
      modo: 'stub' as const,
    };
  }

  async procesarCallback(dto: CallbackIzipayDto) {
    this.asegurarStubHabilitado();

    // ENGANCHE INTEGRACIÓN REAL: validar aqui la firma del IPN (KR-Hash/HMAC de
    // Izipay) sobre el BODY CRUDO recibido, ANTES de leer o mutar Prisma. Si la
    // firma no coincide -> 401/400 y cortar. Precondicion pendiente explicita:
    // hoy solo protege el flag fail-closed; falta la verificacion criptografica.
    const pedido = await this.obtenerPedidoOFallar(dto.pedidoId);

    // WARN-01: el callback de Izipay solo puede tocar pedidos cuyo metodo de
    // pago sea IZIPAY. Un pedido Yape/Plin/WhatsApp jamas debe marcarse pagado
    // por esta via.
    if (pedido.metodoPago !== MetodoPago.IZIPAY) {
      throw new BadRequestException(
        'El pedido no corresponde a un pago por Izipay.',
      );
    }

    // WARN-02: idempotencia ante reintento del IPN. Si ya esta PAGADO con la
    // MISMA referencia, respondemos no-op (200) sin volver a mutar.
    if (
      pedido.estado === EstadoPedido.PAGADO &&
      pedido.referenciaTransaccion === dto.referenciaTransaccion
    ) {
      return pedido;
    }

    // Cualquier otro caso terminal o PAGADO con otra referencia es una
    // transicion invalida (la maquina de estados no permite PAGADO->PAGADO ni
    // volver desde EN_PRODUCCION/ENVIADO/CANCELADO/RECHAZADO).
    if (!transicionPermitida(pedido.estado, EstadoPedido.PAGADO)) {
      throw new BadRequestException(
        `No se puede marcar como PAGADO un pedido en estado ${pedido.estado}.`,
      );
    }

    return this.prisma.pedido.update({
      where: { id: pedido.id },
      data: {
        estado: EstadoPedido.PAGADO,
        proveedorPago: PROVEEDOR_IZIPAY,
        referenciaTransaccion: dto.referenciaTransaccion,
        rawPago: dto as unknown as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * FAIL-CLOSED: el stub solo opera si el entorno lo habilita explicitamente.
   * En cualquier entorno donde el flag no sea 'true' se responde 503, evitando
   * que un stub sin firma marque pedidos como pagados.
   */
  private asegurarStubHabilitado(): void {
    if (this.config.get<string>('IZIPAY_STUB_HABILITADO') !== 'true') {
      throw new ServiceUnavailableException(
        'El pago con Izipay no esta disponible en este momento.',
      );
    }
  }

  private async obtenerPedidoOFallar(pedidoId: string) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
    });
    if (!pedido) {
      throw new BadRequestException('El pedido no existe.');
    }
    return pedido;
  }
}
