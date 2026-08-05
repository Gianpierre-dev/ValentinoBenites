import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CrearPedidoDto } from './crear-pedido.dto';

/** Valida un payload con las mismas reglas que el ValidationPipe global. */
function validar(payload: unknown): string[] {
  const dto = plainToInstance(CrearPedidoDto, payload, {
    enableImplicitConversion: true,
  });
  const errores = validateSync(dto as object, {
    whitelist: true,
    forbidNonWhitelisted: false,
  });
  // Aplana los mensajes de todos los errores (incluye los anidados de items).
  const mensajes: string[] = [];
  const recorrer = (lista: typeof errores): void => {
    for (const e of lista) {
      if (e.constraints) mensajes.push(...Object.values(e.constraints));
      if (e.children?.length) recorrer(e.children);
    }
  };
  recorrer(errores);
  return mensajes;
}

const base = {
  nombreCliente: 'Ana Perez',
  telefono: '987654321',
  items: [{ varianteId: 'var-1', cantidad: 1 }],
};

describe('CrearPedidoDto (validación)', () => {
  it('acepta un pedido bien formado', () => {
    expect(validar(base)).toEqual([]);
  });

  describe('cantidad', () => {
    it('rechaza cantidad negativa', () => {
      const errores = validar({
        ...base,
        items: [{ varianteId: 'v', cantidad: -5 }],
      });
      expect(errores.some((m) => /al menos 1/.test(m))).toBe(true);
    });

    it('rechaza cantidad decimal', () => {
      const errores = validar({
        ...base,
        items: [{ varianteId: 'v', cantidad: 1.5 }],
      });
      expect(errores.length).toBeGreaterThan(0);
    });

    it('rechaza una cantidad enorme (evita el overflow de Decimal(10,2) -> 500)', () => {
      const errores = validar({
        ...base,
        items: [{ varianteId: 'v', cantidad: 999999999 }],
      });
      expect(errores.some((m) => /no puede superar 999/.test(m))).toBe(true);
    });

    it('acepta el tope exacto de 999', () => {
      expect(
        validar({ ...base, items: [{ varianteId: 'v', cantidad: 999 }] }),
      ).toEqual([]);
    });
  });

  describe('comprobanteUrl', () => {
    it('acepta una URL de nuestro proxy de storage', () => {
      const url =
        'https://api-production-2c9f.up.railway.app/api/storage/archivo/abc-123.jpg';
      expect(validar({ ...base, comprobanteUrl: url })).toEqual([]);
    });

    it('rechaza un comprobante alojado en un dominio ajeno', () => {
      const errores = validar({
        ...base,
        comprobanteUrl: 'https://evil.com/fake.jpg',
      });
      expect(errores.some((m) => /subirse desde la tienda/.test(m))).toBe(true);
    });

    it('rechaza una URL de nuestro host pero fuera de la ruta de storage', () => {
      const errores = validar({
        ...base,
        comprobanteUrl:
          'https://api-production-2c9f.up.railway.app/api/pedidos/otro',
      });
      expect(errores.some((m) => /subirse desde la tienda/.test(m))).toBe(true);
    });
  });

  describe('items', () => {
    it('rechaza un pedido sin items', () => {
      const errores = validar({ ...base, items: [] });
      expect(errores.some((m) => /al menos un producto/.test(m))).toBe(true);
    });
  });
});
