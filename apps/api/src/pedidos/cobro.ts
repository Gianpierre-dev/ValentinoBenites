import { EstadoPedido, Prisma } from '@prisma/client';

/**
 * Datos a escribir cuando se recibe el pago del pedido. Ese pago es el del
 * checkout (el comprobante queda atado al subtotal), asi que cubre solo los
 * productos: el envio se cobra aparte con registrarPagoEnvio, aunque ya
 * estuviera cotizado. Asi el monto pagado no depende del orden en que la admin
 * cargo el envio y el pago.
 */
export function datosPagoRecibido(pedido: {
  subtotal: Prisma.Decimal;
}): Prisma.PedidoUpdateManyMutationInput {
  return {
    estado: EstadoPedido.PAGADO,
    montoPagado: pedido.subtotal,
  };
}
