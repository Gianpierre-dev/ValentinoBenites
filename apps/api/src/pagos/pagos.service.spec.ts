import { BadRequestException } from '@nestjs/common';
import { EstadoPedido, MetodoPago } from '@prisma/client';
import { PagosService } from './pagos.service';

type UpdateArgs = [
  {
    where: { id: string };
    data: {
      estado: EstadoPedido;
      proveedorPago: string;
      referenciaTransaccion: string;
      rawPago: Record<string, unknown>;
    };
  },
];

type PrismaMock = {
  pedido: {
    findUnique: jest.Mock;
    update: jest.Mock<unknown, UpdateArgs>;
  };
};

const crearPrismaMock = (): PrismaMock => ({
  pedido: {
    findUnique: jest.fn(),
    update: jest.fn<unknown, UpdateArgs>(),
  },
});

describe('PagosService (Izipay STUB)', () => {
  let prisma: PrismaMock;
  let service: PagosService;

  beforeEach(() => {
    prisma = crearPrismaMock();
    service = new PagosService(prisma as never);
  });

  describe('generarToken', () => {
    it('E5.1 devuelve un formToken stub para un pedido en PENDIENTE_PAGO', async () => {
      prisma.pedido.findUnique.mockResolvedValue({
        id: 'ped-1',
        estado: EstadoPedido.PENDIENTE_PAGO,
        metodoPago: MetodoPago.IZIPAY,
      });

      const resultado = await service.generarToken({ pedidoId: 'ped-1' });

      expect(resultado.modo).toBe('stub');
      expect(resultado.formToken).toContain('ped-1');
      expect(resultado.formToken.startsWith('STUB-')).toBe(true);
      // Stub: no debe tocar ni mutar el pedido al generar el token.
      expect(prisma.pedido.update).not.toHaveBeenCalled();
    });

    it('falla si el pedido no existe', async () => {
      prisma.pedido.findUnique.mockResolvedValue(null);

      await expect(
        service.generarToken({ pedidoId: 'inexistente' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('falla si el pedido no esta en PENDIENTE_PAGO', async () => {
      prisma.pedido.findUnique.mockResolvedValue({
        id: 'ped-1',
        estado: EstadoPedido.PAGADO,
        metodoPago: MetodoPago.IZIPAY,
      });

      await expect(
        service.generarToken({ pedidoId: 'ped-1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('procesarCallback', () => {
    it('E5.2 marca el pedido como PAGADO y guarda la referencia/proveedor/raw', async () => {
      prisma.pedido.findUnique.mockResolvedValue({
        id: 'ped-1',
        estado: EstadoPedido.PENDIENTE_PAGO,
        metodoPago: MetodoPago.IZIPAY,
      });
      prisma.pedido.update.mockImplementation(({ data }) => ({
        id: 'ped-1',
        ...data,
      }));

      const resultado = await service.procesarCallback({
        pedidoId: 'ped-1',
        referenciaTransaccion: 'IZI-TX-9999',
        datos: { estadoIzipay: 'AUTHORISED', monto: 8490 },
      });

      const args = prisma.pedido.update.mock.calls[0][0];
      expect(args.where).toEqual({ id: 'ped-1' });
      expect(args.data.estado).toBe(EstadoPedido.PAGADO);
      expect(args.data.proveedorPago).toBe('IZIPAY');
      expect(args.data.referenciaTransaccion).toBe('IZI-TX-9999');
      expect(args.data.rawPago).toMatchObject({
        referenciaTransaccion: 'IZI-TX-9999',
        datos: { estadoIzipay: 'AUTHORISED', monto: 8490 },
      });
      expect(resultado.estado).toBe(EstadoPedido.PAGADO);
    });

    it('falla si el pedido no existe', async () => {
      prisma.pedido.findUnique.mockResolvedValue(null);

      await expect(
        service.procesarCallback({
          pedidoId: 'inexistente',
          referenciaTransaccion: 'IZI-TX-1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.pedido.update).not.toHaveBeenCalled();
    });

    it('rechaza el callback si la transicion no es valida (pedido ya PAGADO)', async () => {
      prisma.pedido.findUnique.mockResolvedValue({
        id: 'ped-1',
        estado: EstadoPedido.PAGADO,
        metodoPago: MetodoPago.IZIPAY,
      });

      await expect(
        service.procesarCallback({
          pedidoId: 'ped-1',
          referenciaTransaccion: 'IZI-TX-2',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.pedido.update).not.toHaveBeenCalled();
    });
  });
});
