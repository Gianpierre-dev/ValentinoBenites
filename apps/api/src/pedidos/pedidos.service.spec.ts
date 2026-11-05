import { BadRequestException } from '@nestjs/common';
import { EstadoEnvio, EstadoPedido, Prisma } from '@prisma/client';
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
  $transaction: jest.Mock;
  comprobantePago: { updateMany: jest.Mock };
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
  $transaction: jest.fn(),
  comprobantePago: { updateMany: jest.fn() },
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

const API_PUBLICA = 'https://api.test';
const COMPROBANTE = `${API_PUBLICA}/api/storage/archivo/pago.jpg`;

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

  const apiPublicaOriginal = process.env.API_PUBLIC_URL;
  beforeAll(() => {
    process.env.API_PUBLIC_URL = API_PUBLICA;
  });
  afterAll(() => {
    if (apiPublicaOriginal === undefined) delete process.env.API_PUBLIC_URL;
    else process.env.API_PUBLIC_URL = apiPublicaOriginal;
  });

  beforeEach(() => {
    prisma = crearPrismaMock();
    service = new PedidosService(prisma as never);
    // La transaccion corre el callback contra el mismo mock.
    prisma.$transaction.mockImplementation(
      (callback: (tx: PrismaMock) => unknown) => callback(prisma),
    );
    // Por defecto el comprobante esta registrado y libre.
    prisma.comprobantePago.updateMany.mockResolvedValue({ count: 1 });
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

    describe('comprobante', () => {
      it('asigna al pedido creado el comprobante registrado y libre', async () => {
        prisma.variante.findMany.mockResolvedValue([varianteVino]);
        prisma.pedido.create.mockImplementation(({ data }) =>
          Promise.resolve({ id: 'ped-1', ...data }),
        );

        await service.crear(pedido());

        expect(prisma.comprobantePago.updateMany).toHaveBeenCalledWith({
          where: { archivo: 'pago.jpg', pedidoId: null },
          data: { pedidoId: 'ped-1' },
        });
      });

      it('rechaza un comprobante no registrado o ya usado en otro pedido', async () => {
        prisma.variante.findMany.mockResolvedValue([varianteVino]);
        prisma.pedido.create.mockImplementation(({ data }) =>
          Promise.resolve({ id: 'ped-2', ...data }),
        );
        prisma.comprobantePago.updateMany.mockResolvedValue({ count: 0 });

        await expect(service.crear(pedido())).rejects.toThrow(
          'El comprobante no es válido o ya se usó en otro pedido. Vuelve a subirlo para continuar.',
        );
      });

      it('un pedido por WhatsApp no reclama ningún comprobante', async () => {
        prisma.variante.findMany.mockResolvedValue([varianteVino]);
        prisma.pedido.create.mockImplementation(({ data }) =>
          Promise.resolve({ id: 'ped-3', ...data }),
        );

        await service.crear(
          pedido({ billeteraId: undefined, comprobanteUrl: undefined }),
        );

        expect(prisma.comprobantePago.updateMany).not.toHaveBeenCalled();
      });
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
    /** Pedido guardado tal como lo lee el servicio antes de editar el envio. */
    const guardado = (extra: Record<string, unknown> = {}) => ({
      id: 'ped-1',
      subtotal: dec(84.9),
      costoEnvio: dec(0),
      total: dec(84.9),
      montoPagado: null,
      estado: EstadoPedido.PENDIENTE_PAGO,
      estadoEnvio: EstadoEnvio.POR_COORDINAR,
      ...extra,
    });

    interface EscrituraEnvio {
      where: {
        id: string;
        estado: { notIn: EstadoPedido[] };
        estadoEnvio: { not: EstadoEnvio };
      };
      data: {
        costoEnvio: Prisma.Decimal;
        total: Prisma.Decimal;
        direccionEntrega: string | null;
        estadoEnvio: EstadoEnvio;
        montoPagado?: unknown;
      };
    }

    const escritura = () =>
      (prisma.pedido.updateMany.mock.calls[0] as [EscrituraEnvio])[0];

    beforeEach(() => {
      prisma.pedido.updateMany.mockResolvedValue({ count: 1 });
      prisma.pedido.findUniqueOrThrow.mockResolvedValue({ id: 'ped-1' });
    });

    it('recalcula el total y deja el envío cotizado, condicionado a un estado editable', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce(guardado());

      await service.actualizarEnvio('ped-1', {
        costoEnvio: 15,
        direccionEntrega: 'Av. Los Incas 123, Arequipa',
      });

      const { where, data } = escritura();
      expect(where.id).toBe('ped-1');
      expect(where.estado.notIn).toContain(EstadoPedido.ENVIADO);
      expect(where.estadoEnvio).toEqual({ not: EstadoEnvio.PAGADO });
      expect(data.costoEnvio.toNumber()).toBe(15);
      expect(data.total.toNumber()).toBe(99.9);
      expect(data.direccionEntrega).toBe('Av. Los Incas 123, Arequipa');
      expect(data.estadoEnvio).toBe(EstadoEnvio.COTIZADO);
    });

    it('con costo 0 el envío queda sin costo', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce(guardado());

      await service.actualizarEnvio('ped-1', { costoEnvio: 0 });

      expect(escritura().data.estadoEnvio).toBe(EstadoEnvio.SIN_COSTO);
      expect(escritura().data.total.toNumber()).toBe(84.9);
    });

    it('con solo la dirección (sin costo) el envío sigue por coordinar', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce(guardado());

      await service.actualizarEnvio('ped-1', {
        direccionEntrega: 'Jr. Lima 456, Cusco',
      });

      const { data } = escritura();
      expect(data.estadoEnvio).toBe(EstadoEnvio.POR_COORDINAR);
      expect(data.costoEnvio.toNumber()).toBe(0);
      expect(data.direccionEntrega).toBe('Jr. Lima 456, Cusco');
    });

    it('con pago en destino ignora el costo: la tienda no lo cobra', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce(guardado());

      await service.actualizarEnvio('ped-1', {
        costoEnvio: 25,
        pagoEnDestino: true,
      });

      const { data } = escritura();
      expect(data.estadoEnvio).toBe(EstadoEnvio.PAGO_EN_DESTINO);
      expect(data.costoEnvio.toNumber()).toBe(0);
      expect(data.total.toNumber()).toBe(84.9);
    });

    it('en un pedido ya pagado no toca el monto pagado: el envío queda como saldo', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce(
        guardado({ estado: EstadoPedido.PAGADO, montoPagado: dec(84.9) }),
      );

      await service.actualizarEnvio('ped-1', { costoEnvio: 15 });

      const { data } = escritura();
      expect(data.total.toNumber()).toBe(99.9);
      expect(data.estadoEnvio).toBe(EstadoEnvio.COTIZADO);
      expect(data).not.toHaveProperty('montoPagado');
    });

    it('rechaza editar un envío que ya se cobró', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce(
        guardado({
          estado: EstadoPedido.PAGADO,
          estadoEnvio: EstadoEnvio.PAGADO,
        }),
      );

      await expect(
        service.actualizarEnvio('ped-1', { costoEnvio: 30 }),
      ).rejects.toThrow('ya se cobró');
      expect(prisma.pedido.updateMany).not.toHaveBeenCalled();
    });

    it('rechaza editar el envío de un pedido ya ENVIADO', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce(
        guardado({ estado: EstadoPedido.ENVIADO }),
      );

      await expect(
        service.actualizarEnvio('ped-1', { costoEnvio: 15 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.pedido.updateMany).not.toHaveBeenCalled();
    });

    it('falla si el pedido se cerró entre la lectura y la escritura', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce(
        guardado({ estado: EstadoPedido.EN_PRODUCCION }),
      );
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

  describe('registrarPagoEnvio', () => {
    const pagadoConEnvioPendiente = (extra: Record<string, unknown> = {}) => ({
      id: 'ped-1',
      subtotal: dec(84.9),
      costoEnvio: dec(15),
      total: dec(99.9),
      montoPagado: dec(84.9),
      estado: EstadoPedido.EN_PRODUCCION,
      estadoEnvio: EstadoEnvio.COTIZADO,
      ...extra,
    });

    it('suma el costo del envío al monto pagado y cierra el cobro', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce(pagadoConEnvioPendiente());
      prisma.pedido.updateMany.mockResolvedValue({ count: 1 });
      prisma.pedido.findUniqueOrThrow.mockResolvedValue({ id: 'ped-1' });

      await service.registrarPagoEnvio('ped-1', { costoEnvioEsperado: 15 });

      const [{ where, data }] = prisma.pedido.updateMany.mock.calls[0] as [
        {
          where: Record<string, unknown>;
          data: { montoPagado: Prisma.Decimal; estadoEnvio: EstadoEnvio };
        },
      ];
      expect(where).toMatchObject({
        id: 'ped-1',
        estadoEnvio: EstadoEnvio.COTIZADO,
      });
      expect((where.montoPagado as Prisma.Decimal).toNumber()).toBe(84.9);
      expect((where.costoEnvio as Prisma.Decimal).toNumber()).toBe(15);
      expect(data.montoPagado.toNumber()).toBe(99.9);
      expect(data.estadoEnvio).toBe(EstadoEnvio.PAGADO);
    });

    it('pide marcar primero el pedido como pagado si sigue pendiente', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce(
        pagadoConEnvioPendiente({
          estado: EstadoPedido.PENDIENTE_PAGO,
          montoPagado: null,
        }),
      );

      await expect(
        service.registrarPagoEnvio('ped-1', { costoEnvioEsperado: 15 }),
      ).rejects.toThrow('Primero marca el pedido como pagado');
      expect(prisma.pedido.updateMany).not.toHaveBeenCalled();
    });

    it('rechaza si el costo cambió desde que la admin lo vio', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce(
        pagadoConEnvioPendiente({ costoEnvio: dec(20), total: dec(104.9) }),
      );

      await expect(
        service.registrarPagoEnvio('ped-1', { costoEnvioEsperado: 15 }),
      ).rejects.toThrow('cambió mientras lo editabas');
      expect(prisma.pedido.updateMany).not.toHaveBeenCalled();
    });

    it.each([
      EstadoEnvio.PAGADO,
      EstadoEnvio.SIN_COSTO,
      EstadoEnvio.PAGO_EN_DESTINO,
      EstadoEnvio.POR_COORDINAR,
    ])('rechaza registrar el pago con el envío %s', async (estadoEnvio) => {
      prisma.pedido.findUnique.mockResolvedValueOnce(
        pagadoConEnvioPendiente({ estadoEnvio }),
      );

      await expect(
        service.registrarPagoEnvio('ped-1', { costoEnvioEsperado: 15 }),
      ).rejects.toThrow('no tiene un envío pendiente de cobro');
      expect(prisma.pedido.updateMany).not.toHaveBeenCalled();
    });

    it('rechaza si otra acción cambió el pedido en paralelo', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce(pagadoConEnvioPendiente());
      prisma.pedido.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.registrarPagoEnvio('ped-1', { costoEnvioEsperado: 15 }),
      ).rejects.toThrow('cambió mientras lo editabas');
    });
  });

  describe('actualizarEstado', () => {
    const pendiente = (extra: Record<string, unknown> = {}) => ({
      id: 'ped-1',
      subtotal: dec(84.9),
      costoEnvio: dec(15),
      total: dec(99.9),
      estado: EstadoPedido.PENDIENTE_PAGO,
      estadoEnvio: EstadoEnvio.COTIZADO,
      ...extra,
    });

    it('al marcar pagado registra solo los productos: el envío cotizado queda por cobrar', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce(pendiente());
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
        data: { estado: EstadoPedido.PAGADO, montoPagado: dec(84.9) },
      });
      expect(resultado.estado).toBe(EstadoPedido.PAGADO);
    });

    it('las demás transiciones solo cambian el estado', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce(
        pendiente({ estado: EstadoPedido.PAGADO }),
      );
      prisma.pedido.updateMany.mockResolvedValue({ count: 1 });
      prisma.pedido.findUniqueOrThrow.mockResolvedValue({ id: 'ped-1' });

      await service.actualizarEstado('ped-1', {
        estado: EstadoPedido.EN_PRODUCCION,
      });

      const [{ data }] = prisma.pedido.updateMany.mock.calls[0] as [
        { data: Record<string, unknown> },
      ];
      expect(data).toEqual({ estado: EstadoPedido.EN_PRODUCCION });
    });

    it('rechaza si otro cambio ganó en paralelo', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce(pendiente());
      prisma.pedido.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.actualizarEstado('ped-1', { estado: EstadoPedido.PAGADO }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza una transicion invalida PENDIENTE_PAGO -> ENVIADO', async () => {
      prisma.pedido.findUnique.mockResolvedValueOnce(pendiente());

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
