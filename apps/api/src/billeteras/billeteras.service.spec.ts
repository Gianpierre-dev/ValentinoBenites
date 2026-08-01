import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BilleterasService } from './billeteras.service';

type PrismaMock = {
  billetera: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

const crearPrismaMock = (): PrismaMock => ({
  billetera: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
});

describe('BilleterasService', () => {
  let prisma: PrismaMock;
  let service: BilleterasService;

  beforeEach(() => {
    prisma = crearPrismaMock();
    service = new BilleterasService(prisma as never);
  });

  it('crear deriva el slug del nombre (sin tildes, url-safe)', async () => {
    prisma.billetera.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => Promise.resolve(data),
    );

    await service.crear({ nombre: 'Banco de la Nación' });

    const [{ data }] = prisma.billetera.create.mock.calls[0] as [
      { data: { nombre: string; slug: string; activo: boolean } },
    ];
    expect(data.nombre).toBe('Banco de la Nación');
    expect(data.slug).toBe('banco-de-la-nacion');
    expect(data.activo).toBe(true);
  });

  it('crear traduce el duplicado (P2002) a un Conflict legible', async () => {
    prisma.billetera.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(service.crear({ nombre: 'Yape' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('listarActivas filtra por activo y respeta el orden de la admin', async () => {
    prisma.billetera.findMany.mockResolvedValue([]);

    await service.listarActivas();

    expect(prisma.billetera.findMany).toHaveBeenCalledWith({
      where: { activo: true },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    });
  });

  it('actualizar regenera el slug solo cuando cambia el nombre', async () => {
    prisma.billetera.findUnique.mockResolvedValue({ id: 'bil-1' });
    prisma.billetera.update.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => Promise.resolve(data),
    );

    await service.actualizar('bil-1', { activo: false });
    let [{ data }] = prisma.billetera.update.mock.calls[0] as [
      { data: Record<string, unknown> },
    ];
    expect(data.slug).toBeUndefined();
    expect(data.activo).toBe(false);

    await service.actualizar('bil-1', { nombre: 'Agora' });
    [{ data }] = prisma.billetera.update.mock.calls[1] as [
      { data: Record<string, unknown> },
    ];
    expect(data.slug).toBe('agora');
  });

  it('eliminar falla con NotFound si la billetera no existe', async () => {
    prisma.billetera.findUnique.mockResolvedValue(null);

    await expect(service.eliminar('no-existe')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.billetera.delete).not.toHaveBeenCalled();
  });
});
