import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@fabiola.pe';
const ADMIN_PASSWORD = 'admin123';
const WHATSAPP = '51999999999';

interface DefinicionCategoria {
  nombre: string;
  slug: string;
  productos: string[];
}

const CATEGORIAS: DefinicionCategoria[] = [
  {
    nombre: 'Carteras',
    slug: 'carteras',
    productos: [
      'Cartera Tote Clásica',
      'Cartera Bandolera Cuero',
      'Cartera de Mano Elegante',
      'Cartera Shopper Urbana',
      'Cartera Satchel Premium',
      'Cartera Hobo Casual',
      'Cartera Estructurada Negra',
      'Cartera Crossbody Mini',
    ],
  },
  {
    nombre: 'Billeteras',
    slug: 'billeteras',
    productos: [
      'Billetera Larga Mujer',
      'Billetera Compacta Cuero',
      'Billetera con Cierre',
      'Billetera Tarjetero Slim',
      'Billetera Plegable Clásica',
      'Billetera de Viaje',
      'Billetera Minimalista',
    ],
  },
  {
    nombre: 'Monederos',
    slug: 'monederos',
    productos: [
      'Monedero Redondo Cuero',
      'Monedero con Llavero',
      'Monedero Cierre Metálico',
      'Monedero Pequeño Casual',
      'Monedero Estampado',
      'Monedero Doble Compartimento',
      'Monedero Tipo Sobre',
    ],
  },
  {
    nombre: 'Correas',
    slug: 'correas',
    productos: [
      'Correa Cuero Clásica',
      'Correa Hebilla Dorada',
      'Correa Delgada Mujer',
      'Correa Reversible',
      'Correa Trenzada',
      'Correa Ancha Casual',
      'Correa Elegante Negra',
    ],
  },
  {
    nombre: 'Mochilas',
    slug: 'mochilas',
    productos: [
      'Mochila Urbana Cuero',
      'Mochila Antirrobo',
      'Mochila Compacta Mujer',
      'Mochila Convertible',
      'Mochila Casual Diaria',
      'Mochila de Viaje Premium',
      'Mochila Tipo Bolso',
    ],
  },
  {
    nombre: 'Accesorios',
    slug: 'accesorios',
    productos: [
      'Llavero de Cuero',
      'Estuche para Lentes',
      'Porta Pasaporte',
      'Organizador de Cartera',
      'Pañuelo de Seda',
      'Tarjetero Ejecutivo',
      'Set de Cuidado de Cuero',
      'Cinta para Cabello Premium',
    ],
  },
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

function precioRealista(): number {
  // Precios en soles entre 39.90 y 299.90
  const base = 40 + Math.floor(Math.random() * 26) * 10;
  return Number((base - 0.1).toFixed(2));
}

async function limpiar(): Promise<void> {
  await prisma.itemPedido.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.imagenProducto.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.categoria.deleteMany();
}

async function main(): Promise<void> {
  console.log('Iniciando seed de FABIOLA...');
  await limpiar();

  // Usuario admin
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.usuario.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash, nombre: 'Administrador' },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      nombre: 'Administrador',
    },
  });
  console.log(`Usuario admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

  // Configuracion inicial
  const configExistente = await prisma.configuracion.findFirst();
  if (!configExistente) {
    await prisma.configuracion.create({
      data: {
        whatsapp: WHATSAPP,
        datosYape: 'Yape: 999 999 999 - FABIOLA',
        datosPlin: 'Plin: 999 999 999 - FABIOLA',
      },
    });
  }

  // Categorias y productos
  let contadorImagen = 1;
  let totalProductos = 0;

  for (let i = 0; i < CATEGORIAS.length; i += 1) {
    const def = CATEGORIAS[i];
    const categoria = await prisma.categoria.create({
      data: { nombre: def.nombre, slug: def.slug, orden: i },
    });

    for (let j = 0; j < def.productos.length; j += 1) {
      const nombre = def.productos[j];
      const precio = precioRealista();
      const conOferta = (totalProductos + 1) % 4 === 0;
      const destacado = (totalProductos + 1) % 5 === 0;
      const precioOferta = conOferta
        ? Number((precio * 0.8).toFixed(2))
        : null;

      const cantidadImagenes = 1 + (j % 2);
      const imagenes: Prisma.ImagenProductoCreateWithoutProductoInput[] = [];
      for (let k = 0; k < cantidadImagenes; k += 1) {
        imagenes.push({
          url: `https://picsum.photos/seed/${contadorImagen}/600/600`,
          orden: k,
        });
        contadorImagen += 1;
      }

      await prisma.producto.create({
        data: {
          nombre,
          slug: generarSlug(nombre, totalProductos + 1),
          descripcion: `${nombre} de FABIOLA. Cuero de alta calidad con acabados finos. Ideal para el uso diario y ocasiones especiales.`,
          precio: new Prisma.Decimal(precio),
          precioOferta:
            precioOferta !== null ? new Prisma.Decimal(precioOferta) : null,
          stock: 10 + Math.floor(Math.random() * 40),
          destacado,
          activo: true,
          categoriaId: categoria.id,
          imagenes: { create: imagenes },
        },
      });
      totalProductos += 1;
    }
  }

  console.log(
    `Seed completada: ${CATEGORIAS.length} categorias, ${totalProductos} productos.`,
  );
}

main()
  .catch((error) => {
    console.error('Error en seed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
