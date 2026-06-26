import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@fabiola.pe';
const WHATSAPP = '51999999999';
const EN_PRODUCCION = process.env.NODE_ENV === 'production';

// La contraseña del admin nunca se hardcodea: viene de SEED_ADMIN_PASSWORD.
// En producción la seed se niega a correr salvo que se habilite EXPLÍCITAMENTE
// con dos variables presentes a la vez: PERMITIR_SEED_PROD=true y un
// SEED_ADMIN_PASSWORD fuerte (>=8 caracteres). Sin ambas, la seed lanza error.
function obtenerPasswordAdmin(): string {
  const desdeEnv = process.env.SEED_ADMIN_PASSWORD;
  if (EN_PRODUCCION) {
    const permitido = process.env.PERMITIR_SEED_PROD === 'true';
    if (!permitido || !desdeEnv || desdeEnv.length < 8) {
      throw new Error(
        'La seed no debe ejecutarse en producción. Para habilitarla, define ' +
          'PERMITIR_SEED_PROD=true y SEED_ADMIN_PASSWORD (>=8 caracteres).',
      );
    }
    return desdeEnv;
  }
  if (desdeEnv && desdeEnv.length >= 8) return desdeEnv;
  return 'admin123';
}

// Catálogo real de Valentino Benites. Las fotos viven en apps/web/public/productos
// (foto-01.jpg .. foto-50.jpg). NOMBRES y PRECIOS son estimados/placeholder:
// se ajustan desde el panel admin. foto 01-37 = bandoleras cruzadas; 38-50 = carteras grandes.
interface DefProducto {
  nombre: string;
  foto: number; // índice de foto-NN.jpg
  precio: number;
  oferta?: number;
  destacado?: boolean;
}

const BANDOLERAS: DefProducto[] = [
  { nombre: 'Bandolera Animal Print Gris', foto: 1, precio: 79.9, destacado: true },
  { nombre: 'Bandolera Andina Multicolor', foto: 2, precio: 84.9, destacado: true },
  { nombre: 'Bandolera Andina Vino', foto: 3, precio: 84.9 },
  { nombre: 'Bandolera Étnica Rosa', foto: 4, precio: 82.9 },
  { nombre: 'Bandolera Andina Fucsia', foto: 5, precio: 84.9, oferta: 69.9 },
  { nombre: 'Bandolera Étnica Camel', foto: 6, precio: 82.9 },
  { nombre: 'Bandolera Clásica Camel', foto: 7, precio: 75.9 },
  { nombre: 'Bandolera Andina Turquesa', foto: 8, precio: 84.9, destacado: true },
  { nombre: 'Bandolera Étnica Verde', foto: 9, precio: 82.9 },
  { nombre: 'Bandolera Casual Beige', foto: 10, precio: 72.9 },
  { nombre: 'Bandolera Andina Morada', foto: 11, precio: 84.9 },
  { nombre: 'Bandolera Étnica Azul', foto: 12, precio: 82.9, oferta: 67.9 },
  { nombre: 'Bandolera Clásica Negra', foto: 13, precio: 75.9, destacado: true },
  { nombre: 'Bandolera Urbana Gris', foto: 14, precio: 74.9 },
  { nombre: 'Bandolera Casual Marrón', foto: 15, precio: 72.9 },
  { nombre: 'Bandolera Andina Coral', foto: 16, precio: 84.9 },
  { nombre: 'Bandolera Clásica Azul Marino', foto: 17, precio: 75.9 },
  { nombre: 'Bandolera Étnica Naranja', foto: 18, precio: 82.9 },
  { nombre: 'Bandolera Casual Negra', foto: 19, precio: 72.9 },
  { nombre: 'Bandolera Bicolor Azul Beige', foto: 20, precio: 78.9, destacado: true },
  { nombre: 'Bandolera Andina Cielo', foto: 21, precio: 84.9 },
  { nombre: 'Bandolera Clásica Camel II', foto: 22, precio: 75.9 },
  { nombre: 'Bandolera Urbana Negra', foto: 23, precio: 74.9, oferta: 59.9 },
  { nombre: 'Bandolera Casual Arena', foto: 24, precio: 72.9 },
  { nombre: 'Bandolera Étnica Berenjena', foto: 25, precio: 82.9 },
  { nombre: 'Bandolera Clásica Taupe', foto: 26, precio: 75.9 },
  { nombre: 'Bandolera Bicolor Marrón', foto: 27, precio: 78.9 },
  { nombre: 'Bandolera Casual Cemento', foto: 28, precio: 72.9 },
  { nombre: 'Bandolera Urbana Camel', foto: 29, precio: 74.9 },
  { nombre: 'Bandolera Clásica Arena', foto: 30, precio: 75.9 },
  { nombre: 'Bandolera Casual Oliva', foto: 31, precio: 72.9 },
  { nombre: 'Bandolera Urbana Marrón', foto: 32, precio: 74.9 },
  { nombre: 'Bandolera Clásica Perla', foto: 33, precio: 75.9 },
  { nombre: 'Bandolera Casual Café', foto: 34, precio: 72.9, oferta: 58.9 },
  { nombre: 'Bandolera Urbana Beige', foto: 35, precio: 74.9 },
  { nombre: 'Bandolera Clásica Chocolate', foto: 36, precio: 75.9 },
  { nombre: 'Bandolera Casual Tabaco', foto: 37, precio: 72.9 },
];

const CARTERAS: DefProducto[] = [
  { nombre: 'Cartera Tote Andina Grande', foto: 38, precio: 139.9, destacado: true },
  { nombre: 'Cartera Tote Étnica Multicolor', foto: 39, precio: 139.9 },
  { nombre: 'Cartera Shopper Andina', foto: 40, precio: 129.9, destacado: true },
  { nombre: 'Cartera Tote Azteca', foto: 41, precio: 139.9 },
  { nombre: 'Cartera Shopper Étnica', foto: 42, precio: 129.9, oferta: 109.9 },
  { nombre: 'Cartera Tote Andina Vino', foto: 43, precio: 139.9 },
  { nombre: 'Cartera Shopper Multicolor', foto: 44, precio: 129.9 },
  { nombre: 'Cartera Tote Étnica Camel', foto: 45, precio: 139.9, destacado: true },
  { nombre: 'Cartera Shopper Azteca', foto: 46, precio: 129.9 },
  { nombre: 'Cartera Tote Andina Turquesa', foto: 47, precio: 139.9 },
  { nombre: 'Cartera Shopper Andina Coral', foto: 48, precio: 129.9 },
  { nombre: 'Cartera Tote Étnica Grande II', foto: 49, precio: 139.9, oferta: 115.9 },
  { nombre: 'Cartera Shopper Étnica Azul', foto: 50, precio: 129.9 },
];

function generarSlug(texto: string, indice: number): string {
  const base = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${base}-${indice}`;
}

function urlFoto(n: number): string {
  return `/productos/foto-${String(n).padStart(2, '0')}.jpg`;
}

async function limpiar(): Promise<void> {
  await prisma.itemPedido.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.imagenProducto.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.categoria.deleteMany();
}

async function crearProductos(
  defs: DefProducto[],
  categoriaId: string,
  desde: number,
): Promise<number> {
  let i = desde;
  for (const def of defs) {
    i += 1;
    await prisma.producto.create({
      data: {
        nombre: def.nombre,
        slug: generarSlug(def.nombre, i),
        descripcion: `${def.nombre} de Valentino Benites. Cuero sintético de alta calidad con acabados finos y herrajes metálicos. Diseño versátil para el día a día.`,
        precio: new Prisma.Decimal(def.precio),
        precioOferta: def.oferta ? new Prisma.Decimal(def.oferta) : null,
        stock: 15,
        destacado: def.destacado ?? false,
        activo: true,
        categoriaId,
        imagenes: { create: [{ url: urlFoto(def.foto), orden: 0 }] },
      },
    });
  }
  return i;
}

async function main(): Promise<void> {
  console.log('Iniciando seed de Valentino Benites...');
  await limpiar();

  const adminExistente = await prisma.usuario.findUnique({
    where: { email: ADMIN_EMAIL },
  });
  if (!adminExistente) {
    const passwordHash = await bcrypt.hash(obtenerPasswordAdmin(), 10);
    await prisma.usuario.create({
      data: { email: ADMIN_EMAIL, passwordHash, nombre: 'Administrador' },
    });
    console.log(`Usuario admin creado: ${ADMIN_EMAIL} (contraseña no mostrada)`);
  } else {
    console.log(`Usuario admin ya existe: ${ADMIN_EMAIL} (sin cambios)`);
  }

  // Configuración: no se pisa si ya existe (conserva redes/whatsapp reales).
  const configExistente = await prisma.configuracion.findFirst();
  if (!configExistente) {
    await prisma.configuracion.create({
      data: {
        whatsapp: WHATSAPP,
        instagram: 'valentinobenites.pe',
        facebook: 'valentinobenites',
      },
    });
  }

  const bandoleras = await prisma.categoria.create({
    data: { nombre: 'Bandoleras', slug: 'bandoleras', orden: 0 },
  });
  const carteras = await prisma.categoria.create({
    data: { nombre: 'Carteras', slug: 'carteras', orden: 1 },
  });

  const tras = await crearProductos(BANDOLERAS, bandoleras.id, 0);
  await crearProductos(CARTERAS, carteras.id, tras);

  const total = BANDOLERAS.length + CARTERAS.length;
  console.log(`Seed completada: 2 categorias, ${total} productos reales.`);
}

main()
  .catch((error) => {
    console.error('Error en seed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
