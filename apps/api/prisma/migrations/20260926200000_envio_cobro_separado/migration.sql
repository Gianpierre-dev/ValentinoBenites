-- CreateEnum
CREATE TYPE "EstadoEnvio" AS ENUM ('POR_COORDINAR', 'COTIZADO', 'PAGADO', 'PAGO_EN_DESTINO', 'SIN_COSTO');

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "estadoEnvio" "EstadoEnvio" NOT NULL DEFAULT 'POR_COORDINAR',
ADD COLUMN     "montoPagado" DECIMAL(10,2);


-- Relleno de los pedidos existentes.
-- Los pedidos que ya pasaron por "Pagado" recibieron su total en ese momento.
UPDATE "pedidos"
SET "montoPagado" = "total"
WHERE "estado" IN ('PAGADO', 'EN_PRODUCCION', 'ENVIADO');

-- Estado del envio a partir de lo que ya habia cargado la admin: con costo, el
-- envio quedo incluido en el total (pagado si el pedido ya se pago); en 0 con
-- direccion registrada, fue sin costo.
UPDATE "pedidos"
SET "estadoEnvio" = CASE
  WHEN "costoEnvio" > 0 AND "estado" IN ('PAGADO', 'EN_PRODUCCION', 'ENVIADO') THEN 'PAGADO'::"EstadoEnvio"
  WHEN "costoEnvio" > 0 THEN 'COTIZADO'::"EstadoEnvio"
  WHEN "direccionEntrega" IS NOT NULL THEN 'SIN_COSTO'::"EstadoEnvio"
  ELSE 'POR_COORDINAR'::"EstadoEnvio"
END;
