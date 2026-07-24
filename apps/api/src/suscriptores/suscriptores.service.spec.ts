import { Prisma } from '@prisma/client';
import { SuscriptoresService } from './suscriptores.service';

type PrismaMock = {
  suscriptor: { create: jest.Mock; findMany: jest.Mock };
};

const crearPrismaMock = (): PrismaMock => ({
  suscriptor: { create: jest.fn(), findMany: jest.fn() },
});

describe('SuscriptoresService (newsletter)', () => {
  let prisma: PrismaMock;
  let service: SuscriptoresService;

  beforeEach(() => {
    prisma = crearPrismaMock();
    service = new SuscriptoresService(prisma as never);
  });

  it('normaliza el email a minusculas antes de guardar', async () => {
    prisma.suscriptor.create.mockResolvedValue({});

    const resultado = await service.suscribir({ email: '  Maria@Mail.COM ' });

    expect(resultado).toEqual({ suscrito: true });
    const [{ data }] = prisma.suscriptor.create.mock.calls[0] as [
      { data: { email: string } },
    ];
    expect(data.email).toBe('maria@mail.com');
  });

  it('es idempotente: un email ya suscrito responde igual que un alta nueva', async () => {
    prisma.suscriptor.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicado', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.suscribir({ email: 'maria@mail.com' }),
    ).resolves.toEqual({ suscrito: true });
  });
});
