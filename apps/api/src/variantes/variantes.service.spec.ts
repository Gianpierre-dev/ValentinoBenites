import { NotFoundException } from '@nestjs/common';
import { VariantesService } from './variantes.service';

type CreateArgs = [{ data: Record<string, unknown> }];

type PrismaMock = {
  producto: { findUnique: jest.Mock };
  variante: {
    findUnique: jest.Mock;
    create: jest.Mock<unknown, CreateArgs>;
    update: jest.Mock;
  };
  imagenVariante: {
    create: jest.Mock<unknown, CreateArgs>;
    findUnique: jest.Mock;
    delete: jest.Mock;
  };
};

const crearPrismaMock = (): PrismaMock => ({
  producto: { findUnique: jest.fn() },
  variante: {
    findUnique: jest.fn(),
    create: jest.fn<unknown, CreateArgs>(),
    update: jest.fn<unknown, CreateArgs>(),
  },
  imagenVariante: {
    create: jest.fn<unknown, CreateArgs>(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
});

describe('VariantesService', () => {
  let prisma: PrismaMock;
  let service: VariantesService;

  beforeEach(() => {
    prisma = crearPrismaMock();
    service = new VariantesService(prisma as never);
  });

  describe('crear', () => {
    it('crea una variante bajo un producto existente', async () => {
      prisma.producto.findUnique.mockResolvedValue({ id: 'prod-1' });
      prisma.variante.create.mockImplementation(({ data }) => ({
        id: 'var-1',
        ...data,
      }));

      const resultado = await service.crear('prod-1', {
        color: 'Vino',
        colorHex: '#7D2181',
      });

      expect(prisma.variante.create).toHaveBeenCalledTimes(1);
      expect(resultado).toMatchObject({
        id: 'var-1',
        productoId: 'prod-1',
        color: 'Vino',
        colorHex: '#7D2181',
      });
    });

    it('falla si el producto no existe', async () => {
      prisma.producto.findUnique.mockResolvedValue(null);

      await expect(
        service.crear('inexistente', { color: 'Vino' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.variante.create).not.toHaveBeenCalled();
    });

    it('crea la variante con sus imagenes propias cuando se envian', async () => {
      prisma.producto.findUnique.mockResolvedValue({ id: 'prod-1' });
      prisma.variante.create.mockImplementation(({ data }) => data);

      await service.crear('prod-1', {
        color: 'Rosa',
        imagenes: [{ url: 'rosa-1.jpg', orden: 0 }],
      });

      const args = prisma.variante.create.mock.calls[0][0];
      expect(args.data.imagenes).toEqual({
        create: [{ url: 'rosa-1.jpg', orden: 0 }],
      });
    });
  });

  describe('actualizar', () => {
    it('actualiza los campos de una variante existente', async () => {
      prisma.variante.findUnique.mockResolvedValue({ id: 'var-1' });
      prisma.variante.update.mockResolvedValue({ id: 'var-1', color: 'Negro' });

      await service.actualizar('var-1', { color: 'Negro' });

      expect(prisma.variante.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'var-1' },
          data: { color: 'Negro', imagenes: undefined },
        }),
      );
    });

    it('falla si la variante no existe', async () => {
      prisma.variante.findUnique.mockResolvedValue(null);

      await expect(
        service.actualizar('inexistente', { color: 'Negro' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('eliminar (soft-delete)', () => {
    it('marca la variante como inactiva en lugar de borrarla', async () => {
      prisma.variante.findUnique.mockResolvedValue({ id: 'var-1' });
      prisma.variante.update.mockResolvedValue({ id: 'var-1', activo: false });

      const resultado = await service.eliminar('var-1');

      expect(prisma.variante.update).toHaveBeenCalledWith({
        where: { id: 'var-1' },
        data: { activo: false },
      });
      expect(resultado).toEqual({ id: 'var-1', activo: false });
    });

    it('falla si la variante no existe', async () => {
      prisma.variante.findUnique.mockResolvedValue(null);

      await expect(service.eliminar('inexistente')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.variante.update).not.toHaveBeenCalled();
    });
  });

  describe('agregarImagen', () => {
    it('agrega una imagen propia a una variante existente', async () => {
      prisma.variante.findUnique.mockResolvedValue({ id: 'var-1' });
      prisma.imagenVariante.create.mockImplementation(({ data }) => ({
        id: 'img-1',
        ...data,
      }));

      const resultado = await service.agregarImagen('var-1', {
        url: 'vino-1.jpg',
      });

      expect(resultado).toMatchObject({
        id: 'img-1',
        varianteId: 'var-1',
        url: 'vino-1.jpg',
      });
    });

    it('falla si la variante no existe', async () => {
      prisma.variante.findUnique.mockResolvedValue(null);

      await expect(
        service.agregarImagen('inexistente', { url: 'x.jpg' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('eliminarImagen', () => {
    it('borra una imagen de variante existente', async () => {
      prisma.imagenVariante.findUnique.mockResolvedValue({ id: 'img-1' });
      prisma.imagenVariante.delete.mockResolvedValue({ id: 'img-1' });

      const resultado = await service.eliminarImagen('img-1');

      expect(prisma.imagenVariante.delete).toHaveBeenCalledWith({
        where: { id: 'img-1' },
      });
      expect(resultado).toEqual({ eliminada: true });
    });

    it('falla si la imagen no existe', async () => {
      prisma.imagenVariante.findUnique.mockResolvedValue(null);

      await expect(
        service.eliminarImagen('inexistente'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
