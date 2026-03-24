/*
  Warnings:

  - Changed the column `provider` on the `User` table from a scalar field to a list field. If there are non-null values in that column, this step will fail.

*/
-- AlterTable
ALTER TABLE "User"
ALTER COLUMN "provider" DROP DEFAULT,
ALTER COLUMN "provider" TYPE "PROVIDER"[]
USING ARRAY[provider];
