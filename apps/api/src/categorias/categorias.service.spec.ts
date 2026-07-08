import { CategoriasService } from './categorias.service';

type PrismaMock = {
  categoria: { findMany: jest.Mock };
};

const crearPrismaMock = (): PrismaMock => ({
  categoria: { findMany: jest.fn() },
});

describe('CategoriasService.listarActivas (conteo para filtros)', () => {
  let prisma: PrismaMock;
  let service: CategoriasService;

  beforeEach(() => {
    prisma = crearPrismaMock();
    service = new CategoriasService(prisma as never);
  });

  it('pide solo categorias activas y cuenta unicamente productos activos', async () => {
    prisma.categoria.findMany.mockResolvedValue([]);

    await service.listarActivas();

    const [args] = prisma.categoria.findMany.mock.calls[0] as [
      {
        where: Record<string, unknown>;
        select: {
          _count: { select: { productos: { where: Record<string, unknown> } } };
        };
      },
    ];
    expect(args.where).toEqual({ activo: true });
    expect(args.select._count.select.productos.where).toEqual({ activo: true });
  });

  it('expone cantidadProductos a partir del _count de Prisma', async () => {
    prisma.categoria.findMany.mockResolvedValue([
      {
        id: 'cat-1',
        nombre: 'Bandoleras',
        slug: 'bandoleras',
        orden: 0,
        activo: true,
        _count: { productos: 12 },
      },
    ]);

    const resultado = await service.listarActivas();

    expect(resultado[0]).toMatchObject({
      nombre: 'Bandoleras',
      slug: 'bandoleras',
      cantidadProductos: 12,
    });
    // No filtramos el objeto interno de conteo hacia el cliente.
    expect(resultado[0]).not.toHaveProperty('_count');
  });
});
