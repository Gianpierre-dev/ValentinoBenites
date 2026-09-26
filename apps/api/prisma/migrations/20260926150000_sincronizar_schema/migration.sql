-- Puesta al día: cambios de schema que se aplicaron en producción con `db push`
-- sin migración. En producción se marca como aplicada (migrate resolve); en una
-- base nueva se ejecuta normalmente.

-- CreateEnum
CREATE TYPE "TipoReclamo" AS ENUM ('RECLAMO', 'QUEJA');

-- CreateEnum
CREATE TYPE "EstadoReclamo" AS ENUM ('PENDIENTE', 'RESPONDIDO');

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "ciudadEntrega" TEXT,
ADD COLUMN     "costoEnvio" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "direccionEntrega" TEXT,
ADD COLUMN     "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
ALTER COLUMN "metodoPago" TYPE TEXT USING "metodoPago"::TEXT;

-- AlterTable
ALTER TABLE "configuracion" DROP COLUMN "datosPlin",
DROP COLUMN "datosYape",
DROP COLUMN "qrPlin",
DROP COLUMN "qrYape",
ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "razonSocial" TEXT,
ADD COLUMN     "ruc" TEXT;

-- DropEnum
DROP TYPE "MetodoPago";

-- CreateTable
CREATE TABLE "billeteras" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "instrucciones" TEXT,
    "qrUrl" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billeteras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reclamos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" "TipoReclamo" NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "domicilio" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "esMenorDeEdad" BOOLEAN NOT NULL DEFAULT false,
    "apoderado" TEXT,
    "descripcionBien" TEXT NOT NULL,
    "montoReclamado" DECIMAL(10,2),
    "detalle" TEXT NOT NULL,
    "pedidoConsumidor" TEXT NOT NULL,
    "respuesta" TEXT,
    "estado" "EstadoReclamo" NOT NULL DEFAULT 'PENDIENTE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondidoEn" TIMESTAMP(3),
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reclamos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suscriptores" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suscriptores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "billeteras_slug_key" ON "billeteras"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "reclamos_codigo_key" ON "reclamos"("codigo");

-- CreateIndex
CREATE INDEX "reclamos_estado_idx" ON "reclamos"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "suscriptores_email_key" ON "suscriptores"("email");

