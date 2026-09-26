import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CrearPedidoDto } from './crear-pedido.dto';

const API_PUBLICA = 'https://api-production-2c9f.up.railway.app';

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

// Pedido por WhatsApp: no lleva comprobante.
const base = {
  nombreCliente: 'Ana Perez',
  telefono: '987654321',
  aceptaTerminos: true,
  items: [{ varianteId: 'var-1', cantidad: 1 }],
};

describe('CrearPedidoDto (validación)', () => {
  const apiPublicaOriginal = process.env.API_PUBLIC_URL;
  beforeAll(() => {
    process.env.API_PUBLIC_URL = API_PUBLICA;
  });
  afterAll(() => {
    process.env.API_PUBLIC_URL = apiPublicaOriginal;
  });

  it('acepta un pedido bien formado', () => {
    expect(validar(base)).toEqual([]);
  });

  describe('consentimiento', () => {
    it('rechaza un pedido sin aceptar los términos', () => {
      const errores = validar({ ...base, aceptaTerminos: false });
      expect(errores.some((m) => /Política de Privacidad/.test(m))).toBe(true);
    });

    it('rechaza un pedido que omite el consentimiento', () => {
      const sinConsentimiento: Record<string, unknown> = { ...base };
      delete sinConsentimiento.aceptaTerminos;
      expect(validar(sinConsentimiento).length).toBeGreaterThan(0);
    });
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
    const pagoConBilletera = { ...base, billeteraId: 'bil-yape' };

    it('acepta una URL de nuestro proxy de storage', () => {
      const url = `${API_PUBLICA}/api/storage/archivo/abc-123.jpg`;
      expect(validar({ ...pagoConBilletera, comprobanteUrl: url })).toEqual([]);
    });

    it('exige comprobante al pagar con billetera', () => {
      const errores = validar(pagoConBilletera);
      expect(errores.some((m) => /Sube el comprobante/.test(m))).toBe(true);
    });

    it('rechaza un comprobante alojado en un dominio ajeno', () => {
      const errores = validar({
        ...pagoConBilletera,
        comprobanteUrl: 'https://evil.com/fake.jpg',
      });
      expect(errores.some((m) => /subirse desde la tienda/.test(m))).toBe(true);
    });

    it('rechaza un dominio ajeno que imita la ruta del storage', () => {
      const errores = validar({
        ...pagoConBilletera,
        comprobanteUrl: 'https://atacante.tld/api/storage/archivo/pago.png',
      });
      expect(errores.some((m) => /subirse desde la tienda/.test(m))).toBe(true);
    });

    it('rechaza una URL de nuestro host pero fuera de la ruta de storage', () => {
      const errores = validar({
        ...pagoConBilletera,
        comprobanteUrl: `${API_PUBLICA}/api/pedidos/otro`,
      });
      expect(errores.some((m) => /subirse desde la tienda/.test(m))).toBe(true);
    });
  });

  describe('items', () => {
    it('rechaza un pedido sin items', () => {
      const errores = validar({ ...base, items: [] });
      expect(errores.some((m) => /al menos un producto/.test(m))).toBe(true);
    });

    it('rechaza un pedido con más de 50 productos distintos', () => {
      const items = Array.from({ length: 51 }, (_, i) => ({
        varianteId: `v-${i}`,
        cantidad: 1,
      }));
      const errores = validar({ ...base, items });
      expect(errores.some((m) => /más de 50/.test(m))).toBe(true);
    });
  });

  describe('claveIdempotencia', () => {
    it('acepta un UUID v4', () => {
      expect(
        validar({
          ...base,
          claveIdempotencia: '3f2b1c9e-7a6d-4e5f-8a9b-0c1d2e3f4a5b',
        }),
      ).toEqual([]);
    });

    it('rechaza una clave que no es UUID', () => {
      expect(
        validar({ ...base, claveIdempotencia: 'cualquier-cosa' }).length,
      ).toBeGreaterThan(0);
    });
  });
});
