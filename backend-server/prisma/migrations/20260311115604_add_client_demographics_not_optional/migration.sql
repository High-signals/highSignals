/*
  Warnings:

  - Made the column `clientDemographics` on table `ICP` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ICP" ALTER COLUMN "clientDemographics" SET NOT NULL;
