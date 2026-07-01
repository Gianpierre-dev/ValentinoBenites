import { EstadoPedido } from '@prisma/client';

/**
 * Maquina de estados del pedido (modelo hecho a pedido).
 * Flujo: PENDIENTE_PAGO -> PAGADO -> EN_PRODUCCION -> ENVIADO.
 * CANCELADO se puede alcanzar mientras el pedido no este enviado.
 * RECHAZADO aplica a un pago no validado. ENVIADO/CANCELADO/RECHAZADO son terminales.
 */
const TRANSICIONES: Record<EstadoPedido, readonly EstadoPedido[]> = {
  [EstadoPedido.PENDIENTE_PAGO]: [
    EstadoPedido.PAGADO,
    EstadoPedido.RECHAZADO,
    EstadoPedido.CANCELADO,
  ],
  [EstadoPedido.PAGADO]: [EstadoPedido.EN_PRODUCCION, EstadoPedido.CANCELADO],
  [EstadoPedido.EN_PRODUCCION]: [EstadoPedido.ENVIADO, EstadoPedido.CANCELADO],
  [EstadoPedido.ENVIADO]: [],
  [EstadoPedido.CANCELADO]: [],
  [EstadoPedido.RECHAZADO]: [],
};

export function transicionPermitida(
  desde: EstadoPedido,
  hacia: EstadoPedido,
): boolean {
  return TRANSICIONES[desde].includes(hacia);
}
