import { NotFoundException } from '@nestjs/common';
import { ReclamosService } from './reclamos.service';
import { CrearReclamoDto } from './dto/crear-reclamo.dto';

type PrismaMock = {
  reclamo: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

const crearPrismaMock = (): PrismaMock => ({
  reclamo: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
});

const dtoBase: CrearReclamoDto = {
  tipo: 'RECLAMO',
  nombreCompleto: 'Maria Lopez',
  documento: '12345678',
  domicilio: 'Av. Los Olivos 123, Lima',
  telefono: '987654321',
  descripcionBien: 'Cartera Bandolera Andina',
  detalle: 'El producto llego con un defecto en la costura lateral.',
  pedidoConsumidor: 'Solicito el cambio del producto.',
};

describe('ReclamosService (Libro de Reclamaciones)', () => {
  let prisma: PrismaMock;
  let service: ReclamosService;

  beforeEach(() => {
    prisma = crearPrismaMock();
    service = new ReclamosService(prisma as never);
  });

  it('crea la hoja con codigo LR-YYYY-NNNN y estado PENDIENTE por defecto', async () => {
    prisma.reclamo.findUnique.mockResolvedValue(null);
    prisma.reclamo.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: 'rec-1', estado: 'PENDIENTE', ...data }),
    );

    const reclamo = await service.crear(dtoBase);

    expect(reclamo.codigo).toMatch(/^LR-\d{4}-\d{4}$/);
    const [{ data }] = prisma.reclamo.create.mock.calls[0] as [
      { data: Record<string, unknown> },
    ];
    expect(data.tipo).toBe('RECLAMO');
    expect(data.esMenorDeEdad).toBe(false);
    expect(data.montoReclamado).toBeNull();
  });

  it('guarda el apoderado cuando el consumidor es menor de edad', async () => {
    prisma.reclamo.findUnique.mockResolvedValue(null);
    prisma.reclamo.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => Promise.resolve(data),
    );

    await service.crear({
      ...dtoBase,
      esMenorDeEdad: true,
      apoderado: 'Juan Lopez',
    });

    const [{ data }] = prisma.reclamo.create.mock.calls[0] as [
      { data: Record<string, unknown> },
    ];
    expect(data.esMenorDeEdad).toBe(true);
    expect(data.apoderado).toBe('Juan Lopez');
  });

  it('responder marca RESPONDIDO y registra la fecha de respuesta', async () => {
    prisma.reclamo.findUnique.mockResolvedValue({ id: 'rec-1' });
    prisma.reclamo.update.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: 'rec-1', ...data }),
    );

    const resultado = await service.responder('rec-1', {
      respuesta: 'Coordinamos el cambio del producto por WhatsApp.',
    });

    expect(resultado.estado).toBe('RESPONDIDO');
    const [{ data }] = prisma.reclamo.update.mock.calls[0] as [
      { data: { respondidoEn: Date } },
    ];
    expect(data.respondidoEn).toBeInstanceOf(Date);
  });

  it('responder lanza NotFound si la hoja no existe', async () => {
    prisma.reclamo.findUnique.mockResolvedValue(null);

    await expect(
      service.responder('no-existe', {
        respuesta: 'Respuesta de prueba valida.',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
