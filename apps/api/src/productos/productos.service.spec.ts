import { Prisma } from '@prisma/client';
import { ProductosService } from './productos.service';

const dec = (valor: number) => new Prisma.Decimal(valor);

type PrismaMock = {
  producto: { findMany: jest.Mock };
};

const crearPrismaMock = (): PrismaMock => ({
  producto: { findMany: jest.fn() },
});

describe('ProductosService.listar (contrato del catalogo)', () => {
  let prisma: PrismaMock;
  let service: ProductosService;

  beforeEach(() => {
    prisma = crearPrismaMock();
    service = new ProductosService(prisma as never);
  });

  it('WARN-04 cada producto del catalogo trae imagenesEfectivas y precioEfectivo resueltos', async () => {
    prisma.producto.findMany.mockResolvedValue([
      {
        id: 'prod-1',
        nombre: 'Bandolera Andina',
        precio: dec(120),
        precioOferta: null,
        imagenes: [{ url: 'modelo-1.jpg', orden: 0 }],
        variantes: [
          {
            id: 'var-1',
            color: 'Rosa',
            activo: true,
            precio: null,
            precioOferta: null,
            imagenes: [],
          },
        ],
      },
    ]);

    const resultado = await service.listar({});
    const variante = resultado[0].variantes[0];

    // Sin fotos propias -> hereda las del modelo.
    expect(variante.imagenesEfectivas).toEqual([
      { url: 'modelo-1.jpg', orden: 0 },
    ]);
    // Sin precio propio -> hereda el del modelo.
    expect(variante.precioEfectivo.toNumber()).toBe(120);
  });

  it('traduce precioMin y precioMax a un rango sobre el precio base del producto', async () => {
    prisma.producto.findMany.mockResolvedValue([]);

    await service.listar({ precioMin: 50, precioMax: 200 });

    const [args] = prisma.producto.findMany.mock.calls[0] as [
      { where: Record<string, unknown> },
    ];
    const where = args.where;
    expect(where.precio).toEqual({ gte: 50, lte: 200 });
  });

  it('aplica solo el limite inferior cuando falta precioMax', async () => {
    prisma.producto.findMany.mockResolvedValue([]);

    await service.listar({ precioMin: 80 });

    const [args] = prisma.producto.findMany.mock.calls[0] as [
      { where: Record<string, unknown> },
    ];
    const where = args.where;
    expect(where.precio).toEqual({ gte: 80 });
  });

  it('no agrega filtro de precio cuando no llegan precioMin ni precioMax', async () => {
    prisma.producto.findMany.mockResolvedValue([]);

    await service.listar({});

    const [args] = prisma.producto.findMany.mock.calls[0] as [
      { where: Record<string, unknown> },
    ];
    const where = args.where;
    expect(where.precio).toBeUndefined();
  });
});
