// SEED DE DESARROLLO — destructivo, pensado para el entorno LOCAL.
//
// Resetea el catálogo a un estado conocido (borra y recrea desde el catálogo
// inicial). NO debe usarse para mantener producción: para la carga inicial de
// prod existe `importar-catalogo.ts` (idempotente, no destructivo).
//
// Blindaje: el guard de producción corre ANTES de cualquier borrado. En prod la
// seed se niega salvo que se habilite EXPLÍCITAMENTE con PERMITIR_SEED_PROD=true
// y SEED_ADMIN_PASSWORD (>=8). Sin eso, no toca nada.

import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { readFile } from 'node:fs/promises';
import {
  CATALOGO_INICIAL,
  CONFIGURACION_INICIAL,
  rutaFotoFuente,
  generarSlug,
} from './data/catalogo-inicial';
import { subirFotoAWasabi } from './data/wasabi';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@fabiola.pe';
const EN_PRODUCCION = process.env.NODE_ENV === 'production';

/**
 * Verifica que sea seguro correr una seed DESTRUCTIVA. Debe llamarse ANTES de
 * borrar cualquier dato. Devuelve la contraseña a usar para el admin.
 */
function verificarSeguridadYObtenerPassword(): string {
  const desdeEnv = process.env.SEED_ADMIN_PASSWORD;
  if (EN_PRODUCCION) {
    const permitido = process.env.PERMITIR_SEED_PROD === 'true';
    if (!permitido || !desdeEnv || desdeEnv.length < 8) {
      throw new Error(
        'Seed DESTRUCTIVA bloqueada en producción. Para datos de prod usa ' +
          '`db:importar` (idempotente). Si realmente querés resetear prod, ' +
          'define PERMITIR_SEED_PROD=true y SEED_ADMIN_PASSWORD (>=8).',
      );
    }
    return desdeEnv;
  }
  // Desarrollo: contraseña de conveniencia si no se define una.
  return desdeEnv && desdeEnv.length >= 8 ? desdeEnv : 'admin123';
}

async function limpiar(): Promise<void> {
  await prisma.itemPedido.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.imagenProducto.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.categoria.deleteMany();
}

async function main(): Promise<void> {
  // 1) Guard ANTES de tocar datos (corrige el bug de borrar antes de validar).
  const passwordAdmin = verificarSeguridadYObtenerPassword();

  console.log('Seed de desarrollo (destructiva)...');
  await limpiar();

  const adminExistente = await prisma.usuario.findUnique({
    where: { email: ADMIN_EMAIL },
  });
  if (!adminExistente) {
    const passwordHash = await bcrypt.hash(passwordAdmin, 10);
    await prisma.usuario.create({
      data: { email: ADMIN_EMAIL, passwordHash, nombre: 'Administrador' },
    });
    console.log(`Admin creado: ${ADMIN_EMAIL} (contraseña no mostrada)`);
  } else {
    console.log(`Admin ya existe: ${ADMIN_EMAIL} (sin cambios)`);
  }

  const configExistente = await prisma.configuracion.findFirst();
  if (!configExistente) {
    await prisma.configuracion.create({ data: { ...CONFIGURACION_INICIAL } });
  }

  // Catálogo plano: productos sin categoría. La admin crea familias cuando quiera.
  // Las fotos se SUBEN a Wasabi (no viven en el repo); se guarda la URL del proxy.
  for (let i = 0; i < CATALOGO_INICIAL.length; i += 1) {
    const def = CATALOGO_INICIAL[i];
    const urlFoto = await subirFotoAWasabi(await readFile(rutaFotoFuente(def.foto)));
    await prisma.producto.create({
      data: {
        nombre: def.nombre,
        slug: generarSlug(def.nombre, i + 1),
        descripcion: `${def.nombre} de Valentino Benites. Cuero sintético de alta calidad con acabados finos y herrajes metálicos. Diseño versátil para el día a día.`,
        precio: new Prisma.Decimal(def.precio),
        precioOferta: def.oferta ? new Prisma.Decimal(def.oferta) : null,
        stock: 15,
        destacado: def.destacado ?? false,
        activo: true,
        imagenes: { create: [{ url: urlFoto, orden: 0 }] },
      },
    });
  }

  console.log(`Seed completa: ${CATALOGO_INICIAL.length} productos (catálogo plano).`);
}

main()
  .catch((error) => {
    console.error('Error en seed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
