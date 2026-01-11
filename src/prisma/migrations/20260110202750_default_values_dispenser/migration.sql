-- AlterTable
ALTER TABLE "Dispenser" ADD COLUMN     "locationImgUrl" VARCHAR(255),
ALTER COLUMN "location" DROP NOT NULL,
ALTER COLUMN "sharePercentage" SET DEFAULT 0,
ALTER COLUMN "collectedAmount" SET DEFAULT 0,
ALTER COLUMN "lastPeriondCollectedAmount" SET DEFAULT 0,
ALTER COLUMN "totalMoneyGenerated" SET DEFAULT 0;
