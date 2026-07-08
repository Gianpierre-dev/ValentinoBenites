import { Prisma } from '@prisma/client';
import { serializarProductoPublico } from './productos.serializer';

const dec = (valor: number) => new Prisma.Decimal(valor);

describe('serializarProductoPublico', () => {
  const base = {
    id: 'prod-1',
    nombre: 'Bandolera Andina',
    slug: 'bandolera-andina',
    precio: dec(120),
    precioOferta: null,
    imagenes: [{ url: 'modelo-1.jpg', orden: 0 }],
  };

  it('resuelve imagenesEfectivas de cada variante con fallback al producto', () => {
    const producto = {
      ...base,
      variantes: [
        {
          id: 'var-1',
          color: 'Vino',
          activo: true,
          precio: dec(150),
          precioOferta: null,
          imagenes: [{ url: 'vino-1.jpg', orden: 0 }],
        },
        {
          id: 'var-2',
          color: 'Rosa',
          activo: true,
          precio: null,
          precioOferta: null,
          imagenes: [],
        },
      ],
    };

    const resultado = serializarProductoPublico(producto);

    expect(resultado.variantes[0].imagenesEfectivas).toEqual([
      { url: 'vino-1.jpg', orden: 0 },
    ]);
    // Rosa no tiene fotos propias -> hereda las del modelo
    expect(resultado.variantes[1].imagenesEfectivas).toEqual([
      { url: 'modelo-1.jpg', orden: 0 },
    ]);
  });

  it('WARN-03 expone precioEfectivo por variante (override propio o herencia del modelo)', () => {
    const producto = {
      ...base,
      variantes: [
        {
          id: 'var-1',
          color: 'Vino',
          activo: true,
          precio: dec(150),
          precioOferta: null,
          imagenes: [],
        },
        {
          id: 'var-2',
          color: 'Rosa',
          activo: true,
          precio: null,
          precioOferta: null,
          imagenes: [],
        },
      ],
    };

    const resultado = serializarProductoPublico(producto);

    // Vino tiene precio propio -> 150
    expect(resultado.variantes[0].precioEfectivo.toNumber()).toBe(150);
    // Rosa sin precio propio -> hereda el del modelo (120)
    expect(resultado.variantes[1].precioEfectivo.toNumber()).toBe(120);
  });

  it('excluye las variantes inactivas del catalogo publico', () => {
    const producto = {
      ...base,
      variantes: [
        {
          id: 'var-1',
          color: 'Vino',
          activo: true,
          precio: null,
          precioOferta: null,
          imagenes: [],
        },
        {
          id: 'var-2',
          color: 'Rosa',
          activo: false,
          precio: null,
          precioOferta: null,
          imagenes: [],
        },
      ],
    };

    const resultado = serializarProductoPublico(producto);

    expect(resultado.variantes).toHaveLength(1);
    expect(resultado.variantes[0].color).toBe('Vino');
  });

  it('expone material y dimensiones tal cual vienen del modelo', () => {
    const producto = {
      ...base,
      material: 'Cuero sintetico de alta calidad',
      dimensiones: 'Alto 26 cm - Ancho 30 cm - Fondo 12 cm',
      variantes: [],
    };

    const resultado = serializarProductoPublico(producto);

    expect(resultado.material).toBe('Cuero sintetico de alta calidad');
    expect(resultado.dimensiones).toBe(
      'Alto 26 cm - Ancho 30 cm - Fondo 12 cm',
    );
  });

  it('reduce la categoria a { nombre, slug } y no filtra el resto de columnas', () => {
    const producto = {
      ...base,
      categoria: {
        id: 'cat-1',
        nombre: 'Bandoleras',
        slug: 'bandoleras',
        orden: 0,
        activo: true,
      },
      variantes: [],
    };

    const resultado = serializarProductoPublico(producto);

    expect(resultado.categoria).toEqual({
      nombre: 'Bandoleras',
      slug: 'bandoleras',
    });
  });

  it('expone categoria null cuando el producto no esta clasificado', () => {
    const producto = { ...base, categoria: null, variantes: [] };

    const resultado = serializarProductoPublico(producto);

    expect(resultado.categoria).toBeNull();
  });
});
