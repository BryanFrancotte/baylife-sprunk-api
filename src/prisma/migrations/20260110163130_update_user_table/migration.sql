/*
  Warnings:

  - Added the required column `discordName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "discordName" VARCHAR(255) NOT NULL,
ALTER COLUMN "name" DROP NOT NULL;
