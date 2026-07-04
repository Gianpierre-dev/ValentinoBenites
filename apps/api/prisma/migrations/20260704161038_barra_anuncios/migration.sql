-- AlterTable
ALTER TABLE "configuracion" ADD COLUMN     "barraActiva" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "barraAnuncios" JSONB;
