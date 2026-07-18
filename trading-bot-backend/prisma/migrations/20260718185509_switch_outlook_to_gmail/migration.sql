-- AlterTable
ALTER TABLE "User" DROP COLUMN "outlookAccessToken",
DROP COLUMN "outlookAccountId",
DROP COLUMN "outlookRefreshToken",
ADD COLUMN     "gmailAccessToken" TEXT,
ADD COLUMN     "gmailRefreshToken" TEXT;
