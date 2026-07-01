-- Índices para las FK de items_pedido (convención: toda FK lleva índice).
-- varianteId: acelera la relación inversa Variante.items y el SET NULL al borrar
-- una variante. productoId: índice pre-existente ausente desde el init.
CREATE INDEX "items_pedido_productoId_idx" ON "items_pedido"("productoId");
CREATE INDEX "items_pedido_varianteId_idx" ON "items_pedido"("varianteId");
