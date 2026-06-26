-- DropForeignKey
ALTER TABLE "productos" DROP CONSTRAINT "productos_categoriaId_fkey";

-- AlterTable
ALTER TABLE "productos" ALTER COLUMN "categoriaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;
