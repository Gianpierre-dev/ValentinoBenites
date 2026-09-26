-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "claveIdempotencia" TEXT,
ADD COLUMN     "consentimientoEn" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_claveIdempotencia_key" ON "pedidos"("claveIdempotencia");

