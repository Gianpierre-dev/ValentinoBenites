import { BadRequestException } from '@nestjs/common';
import { EstadoPedido, Prisma } from '@prisma/client';
import { PedidosService } from './pedidos.service';
import { CrearPedidoDto } from './dto/crear-pedido.dto';

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
    data: {
      total: Prisma.Decimal;
      items: { create: LineaCreada[] };
    } & Record<string, unknown>;
  },
];

type PrismaMock = {
  variante: { findMany: jest.Mock };
  producto: { findMany: jest.Mock };
  billetera: { findUnique: jest.Mock };
  pedido: {
    create: jest.Mock<Promise<unknown>, PedidoCreateArgs>;
    findUnique: jest.Mock;
    findUniqueOrThrow: jest.Mock;
    updateMany: jest.Mock;
  };
};

const dec = (valor: number) => new Prisma.Decimal(valor);

const crearPrismaMock = (): PrismaMock => ({
  variante: { findMany: jest.fn() },
  producto: { findMany: jest.fn() },
  billetera: { findUnique: jest.fn() },
  pedido: {
    create: jest.fn<Promise<unknown>, PedidoCreateArgs>(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    updateMany: jest.fn(),
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
    nombre: 'Morral Andino',
    activo: true,
    precio: dec(120),
    precioOferta: null,
  },
};

// Producto "hecho a pedido" para las lineas a coordinar (sin variante elegida).
const productoAndino = {
  id: 'prod-1',
  nombre: 'Morral Andino',
  activo: true,
  precio: dec(120),
  precioOferta: null,
};

// Billetera activa por defecto para los tests de pago manual.
const billeteraYape = { id: 'bil-yape', nombre: 'Yape', activo: true };

const COMPROBANTE = 'https://api.test/api/storage/archivo/pago.jpg';

/** Pedido valido con valores por defecto; cada test pisa lo que le importa. */
const pedido = (extra: Partial<CrearPedidoDto> = {}): CrearPedidoDto => ({
  nombreCliente: 'Ana',
  telefono: '999999999',
  billeteraId: 'bil-yape',
  comprobanteUrl: COMPROBANTE,
  aceptaTerminos: true,
  items: [{ varianteId: 'var-vino', cantidad: 1 }],
  ...extra,
});

const errorUnico = (campo: string) =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
    meta: { target: [campo] },
  });

describe('PedidosService', () => {
  let prisma: PrismaMock;
  let service: PedidosService;

  beforeEach(() => {
    prisma = crearPrismaMock();
    service = new PedidosService(prisma as never);
    // Por defecto: sin variantes ni productos hasta que cada test los configure.
    prisma.variante.findMany.mockResolvedValue([]);
    prisma.producto.findMany.mockResolvedValue([]);
    prisma.billetera.findUnique.mockResolvedValue(billeteraYape);
    prisma.pedido.findUnique.mockResolvedValue(null);
  });

  describe('crear', () => {
    it('crea el pedido con snapshot de color y precio efectivo de la variante', async () => {
      prisma.variante.findMany.mockResolvedValue([varianteVino]);
      prisma.pedido.create.mockImplementation(({ data }) =>
        Promise.resolve(data),
      );

      await service.crear(
        pedido({ items: [{ varianteId: 'var-vino', cantidad: 2 }] }),
      );

      const data = prisma.pedido.create.mock.calls[0][0].data;
      const linea = data.items.create[0];
      expect(linea).toMatchObject({
        varianteId: 'var-vino',
        productoId: 'prod-1',
        nombreProducto: 'Morral Andino',
        colorElegido: 'Vino',
        cantidad: 2,
      });
      expect(linea.precioUnitario.toNumber()).toBe(120);
      expect(linea.subtotal.toNumber()).toBe(240);
      expect(data.total.toNumber()).toBe(240);
    });

    it('registra el momento del consentimiento del cliente', async () => {
      prisma.variante.findMany.mockResolvedValue([varianteVino]);
      prisma.pedido.create.mockImplementation(({ data }) =>
        Promise.resolve(data),
      );

      await service.crear(pedido());

      const data = prisma.pedido.create.mock.calls[0][0].data;
      expect(data.consentimientoEn).toBeInstanceOf(Date);
    });

    it('guarda el NOMBRE de la billetera como snapshot del metodo de pago', async () => {
      prisma.variante.findMany.mockResolvedValue([varianteVino]);
      prisma.billetera.findUnique.mockResolvedValue({
        id: 'bil-agora',
        nombre: 'Agora',
        activo: true,
      });
      prisma.pedido.create.mockImplementation(({ data }) =>
        Promise.resolve(data),
      );

      const data = (await service.crear(
        pedido({ billeteraId: 'bil-agora' }),
      )) as unknown as { metodoPago: string };

      expect(data.metodoPago).toBe('Agora');
    });

    it('sin billeteraId el pedido se coordina por WhatsApp', async () => {
      prisma.variante.findMany.mockResolvedValue([varianteVino]);
      prisma.pedido.create.mockImplementation(({ data }) =>
        Promise.resolve(data),
      );

      const data = (await service.crear(
        pedido({ billeteraId: undefined, comprobanteUrl: undefined }),
      )) as unknown as { metodoPago: string; estado?: string };

      // El estado inicial lo fija el default del schema (PENDIENTE_PAGO).
      expect(data.estado).toBeUndefined();
      expect(data.metodoPago).toBe('WhatsApp');
      expect(prisma.billetera.findUnique).not.toHaveBeenCalled();
    });

    it('rechaza una billetera inexistente o inactiva', async () => {
      prisma.variante.findMany.mockResolvedValue([varianteVino]);
      prisma.billetera.findUnique.mockResolvedValue({
        id: 'bil-vieja',
        nombre: 'Tunki',
        activo: false,
      });

      await expect(
        service.crear(pedido({ billeteraId: 'bil-vieja' })),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.pedido.create).not.toHaveBeenCalled();
    });

    it('aplica el precio override de la variante sobre el precio del modelo', async () => {
      prisma.variante.findMany.mockResolvedValue([
        { ...varianteVino, precio: dec(150) },
      ]);
      prisma.pedido.create.mockImplementation(({ data }) =>
        Promise.resolve(data),
      );

      await service.crear(pedido());

      const data = prisma.pedido.create.mock.calls[0][0].data;
      expect(data.items.create[0].precioUnitario.toNumber()).toBe(150);
    });

    it('reintenta con un codigo nuevo si choca la unicidad del codigo', async () => {
      prisma.variante.findMany.mockResolvedValue([varianteVino]);
      prisma.pedido.create
        .mockRejectedValueOnce(errorUnico('codigo'))
        .mockImplementationOnce(({ data }) => Promise.resolve(data));

      const data = (await service.crear(pedido())) as unknown as {
        total: Prisma.Decimal;
      };

      expect(prisma.pedido.create).toHaveBeenCalledTimes(2);
      expect(data.total.toNumber()).toBe(120);
    });

    it('genera el codigo con el año de Lima', async () => {
      prisma.variante.findMany.mockResolvedValue([varianteVino]);
      prisma.pedido.create.mockImplementation(({ data }) =>
        Promise.resolve(data),
      );

      await service.crear(pedido());

      const codigo = String(prisma.pedido.create.mock.calls[0][0].data.codigo);
      const anioLima = new Intl.DateTimeFormat('es-PE', {
        timeZone: 'America/Lima',
        year: 'numeric',
      }).format(new Date());
      expect(codigo).toMatch(new RegExp(`^FAB-${anioLima}-\\d{4}$`));
    });

    it('crea una linea "A coordinar" (sin variante) con el precio base del producto', async () => {
      prisma.producto.findMany.mockResolvedValue([productoAndino]);
      prisma.pedido.create.mockImplementation(({ data }) =>
        Promise.resolve(data),
      );

      await service.crear(
        pedido({ items: [{ productoId: 'prod-1', cantidad: 2 }] }),
      );

      const data = prisma.pedido.create.mock.calls[0][0].data;
      const linea = data.items.create[0];
      expect(linea).toMatchObject({
        varianteId: null,
        productoId: 'prod-1',
        colorElegido: 'A coordinar',
        cantidad: 2,
      });
      expect(data.total.toNumber()).toBe(240);
    });

    it('usa el precioOferta del producto para la linea a coordinar cuando existe', async () => {
      prisma.producto.findMany.mockResolvedValue([
        { ...productoAndino, precioOferta: dec(99) },
      ]);
      prisma.pedido.create.mockImplementation(({ data }) =>
        Promise.resolve(data),
      );

      await service.crear(
        pedido({ items: [{ productoId: 'prod-1', cantidad: 1 }] }),
      );

      const data = prisma.pedido.create.mock.calls[0][0].data;
      expect(data.items.create[0].precioUnitario.toNumber()).toBe(99);
    });

    it('agrupa lineas repetidas de la misma variante en una sola', async () => {
      prisma.variante.findMany.mockResolvedValue([varianteVino]);
      prisma.pedido.create.mockImplementation(({ data }) =>
        Promise.resolve(data),
      );

      await service.crear(
        pedido({
          items: [
            { varianteId: 'var-vino', cantidad: 2 },
            { varianteId: 'var-vino', cantidad: 3 },
          ],
        }),
      );

      const data = prisma.pedido.create.mock.calls[0][0].data;
      expect(data.items.create).toHaveLength(1);
      expect(data.items.create[0].cantidad).toBe(5);
    });

    it('rechaza lineas repetidas que juntas superan el tope por producto', async () => {
      prisma.variante.findMany.mockResolvedValue([varianteVino]);

      await expect(
        service.crear(
          pedido({
            items: [
              { varianteId: 'var-vino', cantidad: 600 },
              { varianteId: 'var-vino', cantidad: 600 },
            ],
          }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.pedido.create).not.toHaveBeenCalled();
    });

    it('rechaza una variante activa cuyo producto fue desactivado, nombrando el producto', async () => {
      prisma.variante.findMany.mockResolvedValue([
        {
          ...varianteVino,
          producto: { ...varianteVino.producto, activo: false },
        },
      ]);

      await expect(service.crear(pedido())).rejects.toThrow(/Morral Andino/);
      expect(prisma.pedido.create).not.toHaveBeenCalled();
    });

    it('falla si el producto a coordinar no existe o esta inactivo', async () => {
      prisma.producto.findMany.mockResolvedValue([
        { ...productoAndino, activo: false },
      ]);

      await expect(
        service.crear(
          pedido({ items: [{ productoId: 'prod-1', cantidad: 1 }] }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.pedido.create).not.toHaveBeenCalled();
    });

    it('falla si alguna variante no existe', async () => {
      await expect(
        service.crear(
          pedido({ items: [{ varianteId: 'inexistente', cantidad: 1 }] }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.pedido.create).not.toHaveBeenCalled();
    });

    describe('idempotencia', () => {
      const CLAVE = '3f2b1c9e-7a6d-4e5f-8a9b-0c1d2e3f4a5b';

      it('devuelve el pedido existente si la clave ya se usó, sin crear otro', async () => {
        const existente = { id: 'ped-1', codigo: 'FAB-2026-1234' };
        prisma.pedido.findUnique.mockResolvedValueOnce(existente);

        const resultado = await service.crear(
          pedido({ claveIdempotencia: CLAVE }),
        );

        expect(resultado).toBe(existente);
        expect(prisma.pedido.create).not.toHaveBeenCalled();
      });

      it('si el mismo intento llega en paralelo, devuelve el pedido que ganó', async () => {
        const ganador = { id: 'ped-1', codigo: 'FAB-2026-1234' };
        prisma.variante.findMany.mockResolvedValue([varianteVino]);
        prisma.pedido.findUnique
          .mockResolvedValueOnce(null) // chequeo inicial: todavía no existe
          .mockResolvedValueOnce(ganador); // tras el choque del índice único
        prisma.pedido.create.mockRejectedValueOnce(
          errorUnico('claveIdempotencia'),
        );

        const resultado = await service.crear(
          pedido({ claveIdempotencia: CLAVE }),
        );

        expect(resultado).toBe(ganador);
        expect(prisma.pedido.create).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('cotizar', () => {
    it('devuelve el precio vigente y el subtotal de las lineas disponibles', async () => {
      prisma.variante.findMany.mockResolvedValue([
        { ...varianteVino, precio: dec(150) },
      ]);

      const cotizacion = await service.cotizar({
        items: [{ varianteId: 'var-vino', cantidad: 2 }],
      });

      expect(cotizacion.disponible).toBe(true);
      expect(cotizacion.lineas[0]).toMatchObject({
        disponible: true,
        nombreProducto: 'Morral Andino',
      });
      expect(cotizacion.lineas[0].precioUnitario?.toNumber()).toBe(150);
      expect(cotizacion.subtotal.toNumber()).toBe(300);
    });

    it('marca como no disponibles los productos desactivados y los inexistentes, sin sumarlos', async () => {
      prisma.variante.findMany.mockResolvedValue([
        varianteVino,
        {
          ...varianteVino,
          id: 'var-retirada',
          producto: {
            ...varianteVino.producto,
            nombre: 'Cartera Retirada',
            activo: false,
          },
        },
      ]);

      const cotizacion = await service.cotizar({
        items: [
          { varianteId: 'var-vino', cantidad: 1 },
          { varianteId: 'var-retirada', cantidad: 1 },
          { varianteId: 'var-borrada', cantidad: 1 },
        ],
      });

      expect(cotizacion.disponible).toBe(false);
      expect(cotizacion.lineas.map((l) => l.disponible)).toEqual([
        true,
        false,
        false,
      ]);
      expect(cotizacion.lineas[1].nombreProducto).toBe('Cartera Retirada');
      expect(cotizacion.lineas[2].nombreProducto).toBeNull();
      expect(cotizacion.subtotal.toNumber()).toBe(120);
    });

    it('avisa si la billetera elegida ya no está activa', async () => {
      prisma.variante.findMany.mockResolvedValue([varianteVino]);
      prisma.billetera.findUnique.mockResolvedValue({
        ...billeteraYape,
        activo: false,
      });

      const cotizacion = await service.cotizar({
        billeteraId: 'bil-yape',
        items: [{ varianteId: 'var-vino', cantidad: 1 }],
      });

      expect(cotizacion.metodoPagoDisponible).toBe(false);
      expect(cotizacion.disponible).toBe(false);
    });
  });

  describe('actualizarEnvio', () => {
    it('recalcula el total como subtotal + costoEnvio, condicionado a un estado editable', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce({
        id: 'ped-1',
        subtotal: dec(84.9),
        estado: EstadoPedido.PENDIENTE_PAGO,
      });
      prisma.pedido.updateMany.mockResolvedValue({ count: 1 });
      prisma.pedido.findUniqueOrThrow.mockResolvedValue({ id: 'ped-1' });

      await service.actualizarEnvio('ped-1', {
        costoEnvio: 15,
        direccionEntrega: 'Av. Los Incas 123, Arequipa',
      });

      const [{ where, data }] = prisma.pedido.updateMany.mock.calls[0] as [
        {
          where: { id: string; estado: { notIn: EstadoPedido[] } };
          data: {
            costoEnvio: Prisma.Decimal;
            total: Prisma.Decimal;
            direccionEntrega: string;
          };
        },
      ];
      expect(where.id).toBe('ped-1');
      expect(where.estado.notIn).toContain(EstadoPedido.ENVIADO);
      expect(data.costoEnvio.toNumber()).toBe(15);
      expect(data.total.toNumber()).toBe(99.9);
      expect(data.direccionEntrega).toBe('Av. Los Incas 123, Arequipa');
    });

    it('rechaza editar el envío de un pedido ya ENVIADO', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce({
        id: 'ped-1',
        subtotal: dec(84.9),
        estado: EstadoPedido.ENVIADO,
      });

      await expect(
        service.actualizarEnvio('ped-1', { costoEnvio: 15 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.pedido.updateMany).not.toHaveBeenCalled();
    });

    it('falla si el pedido se cerró entre la lectura y la escritura', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce({
        id: 'ped-1',
        subtotal: dec(84.9),
        estado: EstadoPedido.EN_PRODUCCION,
      });
      prisma.pedido.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.actualizarEnvio('ped-1', { costoEnvio: 15 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('falla si el pedido no existe', async () => {
      await expect(
        service.actualizarEnvio('no-existe', { costoEnvio: 10 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('actualizarEstado', () => {
    it('aplica una transicion valida condicionada al estado leído', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce({
        id: 'ped-1',
        estado: EstadoPedido.PENDIENTE_PAGO,
      });
      prisma.pedido.updateMany.mockResolvedValue({ count: 1 });
      prisma.pedido.findUniqueOrThrow.mockResolvedValue({
        id: 'ped-1',
        estado: EstadoPedido.PAGADO,
      });

      const resultado = await service.actualizarEstado('ped-1', {
        estado: EstadoPedido.PAGADO,
      });

      expect(prisma.pedido.updateMany).toHaveBeenCalledWith({
        where: { id: 'ped-1', estado: EstadoPedido.PENDIENTE_PAGO },
        data: { estado: EstadoPedido.PAGADO },
      });
      expect(resultado.estado).toBe(EstadoPedido.PAGADO);
    });

    it('rechaza si otro cambio de estado ganó en paralelo', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce({
        id: 'ped-1',
        estado: EstadoPedido.PENDIENTE_PAGO,
      });
      prisma.pedido.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.actualizarEstado('ped-1', { estado: EstadoPedido.PAGADO }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza una transicion invalida PENDIENTE_PAGO -> ENVIADO', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce({
        id: 'ped-1',
        estado: EstadoPedido.PENDIENTE_PAGO,
      });

      await expect(
        service.actualizarEstado('ped-1', { estado: EstadoPedido.ENVIADO }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.pedido.updateMany).not.toHaveBeenCalled();
    });

    it('falla si el pedido no existe', async () => {
      await expect(
        service.actualizarEstado('inexistente', {
          estado: EstadoPedido.PAGADO,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
