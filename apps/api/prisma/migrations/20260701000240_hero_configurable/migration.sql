-- AlterTable
ALTER TABLE "configuracion" ADD COLUMN     "heroSubtitulo" TEXT,
ADD COLUMN     "heroTextoClaro" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "heroTitulo" TEXT;
