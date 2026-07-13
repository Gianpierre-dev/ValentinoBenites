import { BadRequestException } from '@nestjs/common';
import { EstadoPedido, MetodoPago, Prisma } from '@prisma/client';
import { PedidosService } from './pedidos.service';

interface LineaCreada {
  varianteId: string | null;
  productoId: string;
  nombreProducto: string;
  colorElegido: string;
  cantidad: number;
  precioUnitario: Prisma.Decimal;
  subtotal: Prisma.Decimal;
}

type PedidoCreateArgs = [
  {
    data: { total: Prisma.Decimal; items: { create: LineaCreada[] } } & Record<
      string,
      unknown
    >;
  },
];

type PrismaMock = {
  variante: { findMany: jest.Mock };
  producto: { findMany: jest.Mock };
  pedido: {
    create: jest.Mock<unknown, PedidoCreateArgs>;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

const dec = (valor: number) => new Prisma.Decimal(valor);

const crearPrismaMock = (): PrismaMock => ({
  variante: { findMany: jest.fn() },
  producto: { findMany: jest.fn() },
  pedido: {
    create: jest.fn<unknown, PedidoCreateArgs>(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
});

const varianteVino = {
  id: 'var-vino',
  productoId: 'prod-1',
  color: 'Vino',
  activo: true,
  precio: null,
  precioOferta: null,
  producto: {
    id: 'prod-1',
    nombre: 'Bandolera Andina',
    precio: dec(120),
    precioOferta: null,
  },
};

// Producto "hecho a pedido" para las lineas a coordinar (sin variante elegida).
const productoAndina = {
  id: 'prod-1',
  nombre: 'Bandolera Andina',
  activo: true,
  precio: dec(120),
  precioOferta: null,
};

describe('PedidosService', () => {
  let prisma: PrismaMock;
  let service: PedidosService;

  beforeEach(() => {
    prisma = crearPrismaMock();
    service = new PedidosService(prisma as never);
    // Por defecto: sin variantes ni productos hasta que cada test los configure.
    prisma.variante.findMany.mockResolvedValue([]);
    prisma.producto.findMany.mockResolvedValue([]);
    // El codigo unico consulta pedido.findUnique buscando colision: devolver null.
    prisma.pedido.findUnique.mockResolvedValue(null);
  });

  describe('crear', () => {
    it('crea el pedido con snapshot de color y precio efectivo de la variante', async () => {
      prisma.variante.findMany.mockResolvedValue([varianteVino]);
      prisma.pedido.create.mockImplementation(({ data }) => data);

      await service.crear({
        nombreCliente: 'Ana',
        telefono: '999',
        metodoPago: MetodoPago.YAPE,
        items: [{ varianteId: 'var-vino', cantidad: 2 }],
      });

      const data = prisma.pedido.create.mock.calls[0][0].data;
      const linea = data.items.create[0];
      expect(linea).toMatchObject({
        varianteId: 'var-vino',
        productoId: 'prod-1',
        nombreProducto: 'Bandolera Andina',
        colorElegido: 'Vino',
        cantidad: 2,
      });
      expect(linea.precioUnitario.toNumber()).toBe(120);
      expect(linea.subtotal.toNumber()).toBe(240);
      expect(data.total.toNumber()).toBe(240);
    });

    it('aplica el precio override de la variante sobre el precio del modelo', async () => {
      prisma.variante.findMany.mockResolvedValue([
        { ...varianteVino, precio: dec(150) },
      ]);
      prisma.pedido.create.mockImplementation(({ data }) => data);

      await service.crear({
        nombreCliente: 'Ana',
        telefono: '999',
        metodoPago: MetodoPago.PLIN,
        items: [{ varianteId: 'var-vino', cantidad: 1 }],
      });

      const data = prisma.pedido.create.mock.calls[0][0].data;
      expect(data.items.create[0].precioUnitario.toNumber()).toBe(150);
    });

    it('nace en PENDIENTE_PAGO para WhatsApp/Yape/Plin', async () => {
      prisma.variante.findMany.mockResolvedValue([varianteVino]);
      prisma.pedido.create.mockImplementation(({ data }) => data);

      const data = await service.crear({
        nombreCliente: 'Ana',
        telefono: '999',
        metodoPago: MetodoPago.WHATSAPP,
        items: [{ varianteId: 'var-vino', cantidad: 1 }],
      });

      // El estado inicial lo fija el default del schema (PENDIENTE_PAGO);
      // el servicio no debe forzar otro estado ni tocar stock.
      expect(data.estado).toBeUndefined();
      expect(data.metodoPago).toBe(MetodoPago.WHATSAPP);
    });

    it('SUG-01 reintenta con un codigo nuevo si choca la unicidad (P2002) y no propaga 500', async () => {
      prisma.variante.findMany.mockResolvedValue([varianteVino]);
      const colision = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: 'test' },
      );
      // Primer intento choca por codigo duplicado; el segundo tiene exito.
      prisma.pedido.create
        .mockRejectedValueOnce(colision)
        .mockImplementationOnce(({ data }) => data);

      const data = await service.crear({
        nombreCliente: 'Ana',
        telefono: '999',
        metodoPago: MetodoPago.YAPE,
        items: [{ varianteId: 'var-vino', cantidad: 1 }],
      });

      expect(prisma.pedido.create).toHaveBeenCalledTimes(2);
      expect(data.total.toNumber()).toBe(120);
    });

    it('crea una linea "A coordinar" (sin variante) con el precio base del producto', async () => {
      prisma.producto.findMany.mockResolvedValue([productoAndina]);
      prisma.pedido.create.mockImplementation(({ data }) => data);

      await service.crear({
        nombreCliente: 'Ana',
        telefono: '999',
        metodoPago: MetodoPago.WHATSAPP,
        items: [{ productoId: 'prod-1', cantidad: 2 }],
      });

      const data = prisma.pedido.create.mock.calls[0][0].data;
      const linea = data.items.create[0];
      expect(linea).toMatchObject({
        varianteId: null,
        productoId: 'prod-1',
        nombreProducto: 'Bandolera Andina',
        colorElegido: 'A coordinar',
        cantidad: 2,
      });
      expect(linea.precioUnitario.toNumber()).toBe(120);
      expect(linea.subtotal.toNumber()).toBe(240);
      expect(data.total.toNumber()).toBe(240);
    });

    it('usa el precioOferta del producto para la linea a coordinar cuando existe', async () => {
      prisma.producto.findMany.mockResolvedValue([
        { ...productoAndina, precioOferta: dec(99) },
      ]);
      prisma.pedido.create.mockImplementation(({ data }) => data);

      await service.crear({
        nombreCliente: 'Ana',
        telefono: '999',
        metodoPago: MetodoPago.YAPE,
        items: [{ productoId: 'prod-1', cantidad: 1 }],
      });

      const data = prisma.pedido.create.mock.calls[0][0].data;
      expect(data.items.create[0].precioUnitario.toNumber()).toBe(99);
    });

    it('mezcla un item con color elegido y un item a coordinar en el mismo pedido', async () => {
      prisma.variante.findMany.mockResolvedValue([varianteVino]);
      prisma.producto.findMany.mockResolvedValue([productoAndina]);
      prisma.pedido.create.mockImplementation(({ data }) => data);

      await service.crear({
        nombreCliente: 'Ana',
        telefono: '999',
        metodoPago: MetodoPago.PLIN,
        items: [
          { varianteId: 'var-vino', cantidad: 1 },
          { productoId: 'prod-1', cantidad: 1 },
        ],
      });

      const data = prisma.pedido.create.mock.calls[0][0].data;
      const [conColor, aCoordinar] = data.items.create;
      expect(conColor).toMatchObject({
        varianteId: 'var-vino',
        colorElegido: 'Vino',
      });
      expect(aCoordinar).toMatchObject({
        varianteId: null,
        colorElegido: 'A coordinar',
      });
      // 120 (variante) + 120 (producto base) = 240
      expect(data.total.toNumber()).toBe(240);
    });

    it('falla si el producto a coordinar no existe o esta inactivo', async () => {
      prisma.producto.findMany.mockResolvedValue([]);

      await expect(
        service.crear({
          nombreCliente: 'Ana',
          telefono: '999',
          metodoPago: MetodoPago.YAPE,
          items: [{ productoId: 'inexistente', cantidad: 1 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.pedido.create).not.toHaveBeenCalled();
    });

    it('falla si alguna variante no existe o esta inactiva', async () => {
      // La variante solicitada no vuelve en el findMany (filtrado por activo).
      prisma.variante.findMany.mockResolvedValue([]);

      await expect(
        service.crear({
          nombreCliente: 'Ana',
          telefono: '999',
          metodoPago: MetodoPago.YAPE,
          items: [{ varianteId: 'inexistente', cantidad: 1 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.pedido.create).not.toHaveBeenCalled();
    });
  });

  describe('actualizarEstado', () => {
    it('aplica una transicion valida PENDIENTE_PAGO -> PAGADO', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce({
        id: 'ped-1',
        estado: EstadoPedido.PENDIENTE_PAGO,
      });
      prisma.pedido.update.mockResolvedValue({
        id: 'ped-1',
        estado: EstadoPedido.PAGADO,
      });

      const resultado = await service.actualizarEstado('ped-1', {
        estado: EstadoPedido.PAGADO,
      });

      expect(prisma.pedido.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ped-1' },
          data: { estado: EstadoPedido.PAGADO },
        }),
      );
      expect(resultado.estado).toBe(EstadoPedido.PAGADO);
    });

    it('rechaza una transicion invalida PENDIENTE_PAGO -> ENVIADO', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce({
        id: 'ped-1',
        estado: EstadoPedido.PENDIENTE_PAGO,
      });

      await expect(
        service.actualizarEstado('ped-1', { estado: EstadoPedido.ENVIADO }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.pedido.update).not.toHaveBeenCalled();
    });

    it('falla si el pedido no existe', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.actualizarEstado('inexistente', {
          estado: EstadoPedido.PAGADO,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
