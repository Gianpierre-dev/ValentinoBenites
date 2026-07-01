-- Rediseno transaccional: variantes de color + pedido Izipay-ready (hecho a pedido).
-- Batch 1 (estructural). Migracion NO destructiva sobre las filas de `pedidos`:
-- el rename del enum EstadoPedido mapea los valores historicos con un CASE explicito.
--
-- ATENCION (validar contra PROD antes de desplegar): el CASE de mapeo asume que los
-- unicos valores existentes en produccion son PENDIENTE, VALIDADO y RECHAZADO.
--   PENDIENTE -> PENDIENTE_PAGO
--   VALIDADO  -> PAGADO
--   RECHAZADO -> RECHAZADO
-- Antes de correr esta migracion en produccion, ejecutar:
--   SELECT DISTINCT estado FROM pedidos;
-- y confirmar que no aparece ningun valor fuera de esos tres. Si aparece otro,
-- ampliar el CASE antes de desplegar (de lo contrario el ALTER fallara por valor no mapeado).

-- AlterEnum: renombrar EstadoPedido preservando datos con CASE de mapeo.
BEGIN;
CREATE TYPE "EstadoPedido_new" AS ENUM ('PENDIENTE_PAGO', 'PAGADO', 'EN_PRODUCCION', 'ENVIADO', 'CANCELADO', 'RECHAZADO');
ALTER TABLE "public"."pedidos" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "pedidos" ALTER COLUMN "estado" TYPE "EstadoPedido_new" USING (
  CASE "estado"::text
    WHEN 'PENDIENTE' THEN 'PENDIENTE_PAGO'
    WHEN 'VALIDADO'  THEN 'PAGADO'
    WHEN 'RECHAZADO' THEN 'RECHAZADO'
  END::"EstadoPedido_new"
);
ALTER TYPE "EstadoPedido" RENAME TO "EstadoPedido_old";
ALTER TYPE "EstadoPedido_new" RENAME TO "EstadoPedido";
DROP TYPE "public"."EstadoPedido_old";
ALTER TABLE "pedidos" ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE_PAGO';
COMMIT;

-- AlterEnum
ALTER TYPE "MetodoPago" ADD VALUE 'IZIPAY';

-- AlterTable
ALTER TABLE "items_pedido" ADD COLUMN     "colorElegido" TEXT,
ADD COLUMN     "varianteId" TEXT;

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "proveedorPago" TEXT,
ADD COLUMN     "rawPago" JSONB,
ADD COLUMN     "referenciaTransaccion" TEXT;

-- AlterTable
-- Modelo hecho-a-pedido: se elimina stock (el backfill 1:1 a variantes se hace en Batch 2).
ALTER TABLE "productos" DROP COLUMN "stock";

-- CreateTable
CREATE TABLE "variantes" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "colorHex" TEXT,
    "precio" DECIMAL(10,2),
    "precioOferta" DECIMAL(10,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imagenes_variante" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "varianteId" TEXT NOT NULL,

    CONSTRAINT "imagenes_variante_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "variantes_productoId_idx" ON "variantes"("productoId");

-- CreateIndex
CREATE INDEX "variantes_activo_idx" ON "variantes"("activo");

-- CreateIndex
CREATE INDEX "imagenes_variante_varianteId_idx" ON "imagenes_variante"("varianteId");

-- AddForeignKey
ALTER TABLE "variantes" ADD CONSTRAINT "variantes_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagenes_variante" ADD CONSTRAINT "imagenes_variante_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "variantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_pedido" ADD CONSTRAINT "items_pedido_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "variantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
