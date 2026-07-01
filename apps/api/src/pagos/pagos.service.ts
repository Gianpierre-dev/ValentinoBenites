import { BadRequestException, Injectable } from '@nestjs/common';
import { EstadoPedido, Prisma } from '@prisma/client';
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
  constructor(private readonly prisma: PrismaService) {}

  async generarToken(dto: GenerarTokenDto) {
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
    // PUNTO DE ENGANCHE: validar la firma del IPN aqui antes de continuar.
    const pedido = await this.obtenerPedidoOFallar(dto.pedidoId);

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
