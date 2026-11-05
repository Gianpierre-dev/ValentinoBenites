-- CreateTable
CREATE TABLE "comprobantes_pago" (
    "id" TEXT NOT NULL,
    "archivo" TEXT NOT NULL,
    "pedidoId" TEXT,
    "subidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comprobantes_pago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "comprobantes_pago_archivo_key" ON "comprobantes_pago"("archivo");

-- CreateIndex
CREATE UNIQUE INDEX "comprobantes_pago_pedidoId_key" ON "comprobantes_pago"("pedidoId");

-- AddForeignKey
ALTER TABLE "comprobantes_pago" ADD CONSTRAINT "comprobantes_pago_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
