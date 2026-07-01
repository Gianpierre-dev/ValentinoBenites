import { EstadoPedido } from '@prisma/client';
import { transicionPermitida } from './maquina-estados';

describe('transicionPermitida', () => {
  it('permite el flujo feliz PENDIENTE_PAGO -> PAGADO -> EN_PRODUCCION -> ENVIADO', () => {
    expect(
      transicionPermitida(EstadoPedido.PENDIENTE_PAGO, EstadoPedido.PAGADO),
    ).toBe(true);
    expect(
      transicionPermitida(EstadoPedido.PAGADO, EstadoPedido.EN_PRODUCCION),
    ).toBe(true);
    expect(
      transicionPermitida(EstadoPedido.EN_PRODUCCION, EstadoPedido.ENVIADO),
    ).toBe(true);
  });

  it('permite cancelar desde estados no terminales', () => {
    expect(
      transicionPermitida(EstadoPedido.PENDIENTE_PAGO, EstadoPedido.CANCELADO),
    ).toBe(true);
    expect(
      transicionPermitida(EstadoPedido.PAGADO, EstadoPedido.CANCELADO),
    ).toBe(true);
  });

  it('permite rechazar un pedido pendiente de pago', () => {
    expect(
      transicionPermitida(EstadoPedido.PENDIENTE_PAGO, EstadoPedido.RECHAZADO),
    ).toBe(true);
  });

  it('rechaza el salto invalido PENDIENTE_PAGO -> ENVIADO', () => {
    expect(
      transicionPermitida(EstadoPedido.PENDIENTE_PAGO, EstadoPedido.ENVIADO),
    ).toBe(false);
  });

  it('rechaza retroceder de PAGADO a PENDIENTE_PAGO', () => {
    expect(
      transicionPermitida(EstadoPedido.PAGADO, EstadoPedido.PENDIENTE_PAGO),
    ).toBe(false);
  });

  it('trata ENVIADO, CANCELADO y RECHAZADO como estados terminales', () => {
    expect(
      transicionPermitida(EstadoPedido.ENVIADO, EstadoPedido.CANCELADO),
    ).toBe(false);
    expect(
      transicionPermitida(EstadoPedido.CANCELADO, EstadoPedido.PAGADO),
    ).toBe(false);
    expect(
      transicionPermitida(EstadoPedido.RECHAZADO, EstadoPedido.PAGADO),
    ).toBe(false);
  });
});
