import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MigracionService } from './migracion.service';

// Mock de Prisma que hace de "tx" dentro de $transaction (callback pattern).
type PrismaMock = {
  producto: {
    findUnique: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  variante: {
    findMany: jest.Mock;
    create: jest.Mock;
  };
  $transaction: jest.Mock;
};

const crearPrismaMock = (): PrismaMock => {
  const prisma: PrismaMock = {
    producto: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    variante: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'v-nueva' }),
    },
    // $transaction ejecuta el callback pasandole el propio mock como tx.
    $transaction: jest.fn((cb: (tx: PrismaMock) => unknown) => cb(prisma)),
  };
  return prisma;
};

describe('MigracionService.aplicarAgrupacion (T2.15 / E4.x)', () => {
  let prisma: PrismaMock;
  let service: MigracionService;

  beforeEach(() => {
    prisma = crearPrismaMock();
    service = new MigracionService(prisma as never);
  });

  const grupoBase = () => ({
    cabeceraProductoId: 'C',
    modelo: 'Bandolera Andina',
    requiereRevision: false,
    variantes: [
      { productoId: 'C', color: 'Vino' },
      { productoId: 'A', color: 'Rosa' },
      { productoId: 'B', color: 'Negro' },
    ],
  });

  it('E4.3 no fuerza la aplicacion cuando el grupo sigue marcado requiereRevision', async () => {
    const grupo = { ...grupoBase(), requiereRevision: true };

    await expect(service.aplicarAgrupacion(grupo)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.variante.create).not.toHaveBeenCalled();
    expect(prisma.producto.updateMany).not.toHaveBeenCalled();
  });

  it('falla si el producto cabecera no existe', async () => {
    prisma.producto.findUnique.mockResolvedValue(null);

    await expect(service.aplicarAgrupacion(grupoBase())).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('aplica un grupo: crea una variante por color y absorbe (soft-delete) los productos no cabecera', async () => {
    prisma.producto.findUnique.mockImplementation(({ where }: any) => {
      const productos: Record<string, unknown> = {
        C: { id: 'C', nombre: 'Bandolera Andina', precio: 120, precioOferta: null, imagenes: [] },
        A: {
          id: 'A',
          nombre: 'Bandolera Andina Rosa',
          precio: 130,
          precioOferta: null,
          imagenes: [{ url: 'rosa-1.jpg', orden: 0 }],
        },
        B: {
          id: 'B',
          nombre: 'Bandolera Andina Negro',
          precio: 120,
          precioOferta: null,
          imagenes: [],
        },
      };
      return Promise.resolve(productos[where.id] ?? null);
    });
    prisma.variante.findMany.mockResolvedValue([]);

    const resultado = await service.aplicarAgrupacion(grupoBase());

    // Una variante por cada uno de los 3 colores.
    expect(prisma.variante.create).toHaveBeenCalledTimes(3);
    // Todas las variantes creadas cuelgan de la cabecera.
    for (const llamada of prisma.variante.create.mock.calls) {
      expect(llamada[0].data.productoId).toBe('C');
    }
    // La variante que viene de un producto absorbido (Rosa) reapunta sus imagenes.
    const creacionRosa = prisma.variante.create.mock.calls.find(
      (c) => c[0].data.color === 'Rosa',
    );
    expect(creacionRosa?.[0].data.imagenes?.create).toEqual([
      { url: 'rosa-1.jpg', orden: 0 },
    ]);
    // Soft-delete de los productos absorbidos (A y B), nunca la cabecera.
    expect(prisma.producto.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { in: ['A', 'B'] } }),
        data: { activo: false },
      }),
    );
    expect(resultado.variantesCreadas).toBe(3);
    expect(resultado.productosAbsorbidos.sort()).toEqual(['A', 'B']);
  });

  it('es idempotente: reaplicar no duplica variantes ni vuelve a crear colores existentes', async () => {
    prisma.producto.findUnique.mockImplementation(({ where }: any) =>
      Promise.resolve({
        id: where.id,
        nombre: 'Bandolera Andina',
        precio: 120,
        precioOferta: null,
        imagenes: [],
      }),
    );
    // La cabecera ya tiene los tres colores (fusion previa).
    prisma.variante.findMany.mockResolvedValue([
      { color: 'Vino' },
      { color: 'Rosa' },
      { color: 'Negro' },
    ]);
    // Los absorbidos ya estan inactivos: updateMany no afecta filas.
    prisma.producto.updateMany.mockResolvedValue({ count: 0 });

    const resultado = await service.aplicarAgrupacion(grupoBase());

    expect(prisma.variante.create).not.toHaveBeenCalled();
    expect(resultado.variantesCreadas).toBe(0);
    expect(resultado.variantesExistentes).toBe(3);
  });
});
