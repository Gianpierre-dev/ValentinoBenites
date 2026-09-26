import { esUrlDeStorage } from './url-storage';

const API_PUBLICA = 'https://api-production-2c9f.up.railway.app';

describe('esUrlDeStorage', () => {
  const original = process.env.API_PUBLIC_URL;
  beforeAll(() => {
    process.env.API_PUBLIC_URL = API_PUBLICA;
  });
  afterAll(() => {
    if (original === undefined) delete process.env.API_PUBLIC_URL;
    else process.env.API_PUBLIC_URL = original;
  });

  it('acepta un archivo del proxy de storage del propio backend', () => {
    expect(
      esUrlDeStorage(`${API_PUBLICA}/api/storage/archivo/abc-123.webp`),
    ).toBe(true);
  });

  it('ignora mayúsculas en el host y la barra final de API_PUBLIC_URL', () => {
    process.env.API_PUBLIC_URL = `${API_PUBLICA}/`;
    expect(
      esUrlDeStorage(
        'https://API-PRODUCTION-2C9F.up.railway.app/api/storage/archivo/a.jpg',
      ),
    ).toBe(true);
    process.env.API_PUBLIC_URL = API_PUBLICA;
  });

  it.each([
    [
      'otro dominio con la misma ruta',
      'https://atacante.tld/api/storage/archivo/pago.png',
    ],
    [
      'subdominio que imita el host',
      'https://api-production-2c9f.up.railway.app.atacante.tld/api/storage/archivo/a.png',
    ],
    [
      'http en vez de https',
      'http://api-production-2c9f.up.railway.app/api/storage/archivo/a.png',
    ],
    [
      'otro puerto',
      'https://api-production-2c9f.up.railway.app:8443/api/storage/archivo/a.png',
    ],
    ['ruta distinta del proxy', `${API_PUBLICA}/api/pedidos/otro`],
    ['subcarpeta en el nombre', `${API_PUBLICA}/api/storage/archivo/sub/a.png`],
    ['query string', `${API_PUBLICA}/api/storage/archivo/a.png?x=1`],
    ['fragmento', `${API_PUBLICA}/api/storage/archivo/a.png#x`],
    ['texto que no es URL', 'no-es-una-url'],
  ])('rechaza %s', (_caso, url) => {
    expect(esUrlDeStorage(url)).toBe(false);
  });
});
