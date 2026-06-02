-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "products" TEXT[] DEFAULT ARRAY[]::TEXT[];
