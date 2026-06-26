// IMPORTADOR IDEMPOTENTE del catálogo inicial — seguro para producción.
//
// A diferencia del seed de desarrollo, este script NO borra nada. Por cada
// producto del catálogo inicial hace "crear si no existe" (clave: slug). Si el
// producto ya está, lo respeta TAL CUAL (no pisa precios/nombres que la clienta
// haya ajustado desde el panel). Re-ejecutarlo es seguro: solo agrega faltantes.
//
// Uso: db:importar  (para la carga inicial en producción, una vez).
// La operación normal del catálogo es por el panel admin; este script no se usa
// en el día a día.

import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  CATALOGO_INICIAL,
  CONFIGURACION_INICIAL,
  urlFoto,
  generarSlug,
} from './data/catalogo-inicial';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@fabiola.pe';

async function asegurarAdmin(): Promise<void> {
  const existe = await prisma.usuario.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existe) {
    console.log(`Admin ya existe: ${ADMIN_EMAIL} (sin cambios)`);
    return;
  }
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error(
      'No existe admin y falta SEED_ADMIN_PASSWORD (>=8) para crearlo.',
    );
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.usuario.create({
    data: { email: ADMIN_EMAIL, passwordHash, nombre: 'Administrador' },
  });
  console.log(`Admin creado: ${ADMIN_EMAIL} (contraseña no mostrada)`);
}

async function asegurarConfiguracion(): Promise<void> {
  const existe = await prisma.configuracion.findFirst();
  if (existe) {
    console.log('Configuración ya existe (sin cambios).');
    return;
  }
  await prisma.configuracion.create({ data: { ...CONFIGURACION_INICIAL } });
  console.log('Configuración inicial creada.');
}

async function importarProductos(): Promise<{ creados: number; existentes: number }> {
  let creados = 0;
  let existentes = 0;

  for (let i = 0; i < CATALOGO_INICIAL.length; i += 1) {
    const def = CATALOGO_INICIAL[i];
    const slug = generarSlug(def.nombre, i + 1);

    const yaExiste = await prisma.producto.findUnique({ where: { slug } });
    if (yaExiste) {
      existentes += 1;
      continue; // se respeta lo que la clienta haya editado
    }

    await prisma.producto.create({
      data: {
        nombre: def.nombre,
        slug,
        descripcion: `${def.nombre} de Valentino Benites. Cuero sintético de alta calidad con acabados finos y herrajes metálicos. Diseño versátil para el día a día.`,
        precio: new Prisma.Decimal(def.precio),
        precioOferta: def.oferta ? new Prisma.Decimal(def.oferta) : null,
        stock: 15,
        destacado: def.destacado ?? false,
        activo: true,
        imagenes: { create: [{ url: urlFoto(def.foto), orden: 0 }] },
      },
    });
    creados += 1;
  }

  return { creados, existentes };
}

async function main(): Promise<void> {
  console.log('Importando catálogo inicial (idempotente, no destructivo)...');
  await asegurarAdmin();
  await asegurarConfiguracion();
  const { creados, existentes } = await importarProductos();
  console.log(
    `Importación completa: ${creados} creados, ${existentes} ya existían (respetados).`,
  );
}

main()
  .catch((error) => {
    console.error('Error en importación:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
