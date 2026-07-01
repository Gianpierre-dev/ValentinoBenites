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
});
