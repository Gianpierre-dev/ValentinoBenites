import { MigracionService } from './migracion.service';

type PrismaMock = {
  producto: { findMany: jest.Mock };
};

const crearPrismaMock = (): PrismaMock => ({
  producto: { findMany: jest.fn() },
});

describe('MigracionService.proponerAgrupacion', () => {
  let prisma: PrismaMock;
  let service: MigracionService;

  beforeEach(() => {
    prisma = crearPrismaMock();
    service = new MigracionService(prisma as never);
  });

  it('E4.2 agrupa productos del mismo modelo proponiendo una variante por color', async () => {
    prisma.producto.findMany.mockResolvedValue([
      { id: 'p1', nombre: 'Bandolera Andina Vino' },
      { id: 'p2', nombre: 'Bandolera Andina Rosa' },
    ]);

    const grupos = await service.proponerAgrupacion();

    expect(grupos).toHaveLength(1);
    const grupo = grupos[0];
    expect(grupo.modelo).toBe('Bandolera Andina');
    expect(grupo.requiereRevision).toBe(false);
    expect(grupo.variantes.map((v) => v.color).sort()).toEqual([
      'Rosa',
      'Vino',
    ]);
    expect(grupo.variantes.map((v) => v.productoId).sort()).toEqual([
      'p1',
      'p2',
    ]);
  });

  it('E4.3 marca el grupo para revision cuando algun nombre no tiene color', async () => {
    prisma.producto.findMany.mockResolvedValue([
      { id: 'p3', nombre: 'Cartera Shopper Andina' },
    ]);

    const grupos = await service.proponerAgrupacion();

    expect(grupos).toHaveLength(1);
    expect(grupos[0].requiereRevision).toBe(true);
    expect(grupos[0].variantes[0].color).toBe('Único');
  });

  it('separa modelos distintos en grupos distintos', async () => {
    prisma.producto.findMany.mockResolvedValue([
      { id: 'p1', nombre: 'Bandolera Andina Vino' },
      { id: 'p4', nombre: 'Bandolera Étnica Rosa' },
    ]);

    const grupos = await service.proponerAgrupacion();

    expect(grupos).toHaveLength(2);
    expect(grupos.map((g) => g.modelo).sort()).toEqual([
      'Bandolera Andina',
      'Bandolera Étnica',
    ]);
  });
});
