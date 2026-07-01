import { serializarProductoPublico } from './productos.serializer';

describe('serializarProductoPublico', () => {
  const base = {
    id: 'prod-1',
    nombre: 'Bandolera Andina',
    slug: 'bandolera-andina',
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
          imagenes: [{ url: 'vino-1.jpg', orden: 0 }],
        },
        {
          id: 'var-2',
          color: 'Rosa',
          activo: true,
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

  it('excluye las variantes inactivas del catalogo publico', () => {
    const producto = {
      ...base,
      variantes: [
        { id: 'var-1', color: 'Vino', activo: true, imagenes: [] },
        { id: 'var-2', color: 'Rosa', activo: false, imagenes: [] },
      ],
    };

    const resultado = serializarProductoPublico(producto);

    expect(resultado.variantes).toHaveLength(1);
    expect(resultado.variantes[0].color).toBe('Vino');
  });
});
