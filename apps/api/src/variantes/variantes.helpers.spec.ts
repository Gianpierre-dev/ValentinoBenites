import { Prisma } from '@prisma/client';
import {
  imagenesDeVariante,
  precioEfectivoVariante,
} from './variantes.helpers';

const dec = (valor: number) => new Prisma.Decimal(valor);

describe('precioEfectivoVariante', () => {
  const producto = { precio: dec(120), precioOferta: null };

  it('usa el precioOferta de la variante cuando esta presente', () => {
    const variante = { precio: dec(150), precioOferta: dec(140) };
    expect(precioEfectivoVariante(variante, producto).toNumber()).toBe(140);
  });

  it('usa el precio de la variante cuando no hay oferta de variante', () => {
    const variante = { precio: dec(150), precioOferta: null };
    expect(precioEfectivoVariante(variante, producto).toNumber()).toBe(150);
  });

  it('hereda la oferta del producto cuando la variante no tiene precio', () => {
    const variante = { precio: null, precioOferta: null };
    const productoConOferta = { precio: dec(120), precioOferta: dec(99) };
    expect(precioEfectivoVariante(variante, productoConOferta).toNumber()).toBe(
      99,
    );
  });

  it('hereda el precio base del producto como ultimo recurso', () => {
    const variante = { precio: null, precioOferta: null };
    expect(precioEfectivoVariante(variante, producto).toNumber()).toBe(120);
  });
});

describe('imagenesDeVariante', () => {
  it('devuelve las imagenes propias de la variante cuando existen', () => {
    const variante = { imagenes: [{ url: 'variante-1.jpg' }] };
    const producto = { imagenes: [{ url: 'modelo-1.jpg' }] };
    expect(imagenesDeVariante(variante, producto)).toEqual([
      { url: 'variante-1.jpg' },
    ]);
  });

  it('cae al fallback de las imagenes del producto cuando la variante no tiene fotos', () => {
    const variante = { imagenes: [] as { url: string }[] };
    const producto = { imagenes: [{ url: 'modelo-1.jpg' }] };
    expect(imagenesDeVariante(variante, producto)).toEqual([
      { url: 'modelo-1.jpg' },
    ]);
  });
});
