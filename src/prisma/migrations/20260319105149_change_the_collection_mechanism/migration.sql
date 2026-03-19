/*
  Warnings:

  - You are about to drop the column `lastPeriondCollectedAmount` on the `Dispenser` table. All the data in the column will be lost.
  - You are about to drop the column `periodEnd` on the `Dispenser` table. All the data in the column will be lost.
  - You are about to drop the column `periodStart` on the `Dispenser` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Dispenser" DROP COLUMN "lastPeriondCollectedAmount",
DROP COLUMN "periodEnd",
DROP COLUMN "periodStart",
ADD COLUMN     "CollectedAmountToPayment" INTEGER NOT NULL DEFAULT 0;
