-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "aiConfidence" JSONB,
ADD COLUMN     "currency" TEXT DEFAULT 'USD',
ADD COLUMN     "deliveryLocation" TEXT,
ADD COLUMN     "emailId" TEXT,
ADD COLUMN     "eta" TEXT,
ADD COLUMN     "etd" TEXT,
ADD COLUMN     "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "needsReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "port" TEXT,
ADD COLUMN     "rfqNumber" TEXT,
ADD COLUMN     "specialInstructions" TEXT;
