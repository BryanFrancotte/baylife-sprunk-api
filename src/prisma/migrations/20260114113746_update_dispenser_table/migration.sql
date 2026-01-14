/*
  Warnings:

  - You are about to alter the column `sharePercentage` on the `Dispenser` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Dispenser" ALTER COLUMN "sharePercentage" SET DEFAULT 0,
ALTER COLUMN "sharePercentage" SET DATA TYPE INTEGER;
