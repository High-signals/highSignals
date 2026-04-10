/*
  Warnings:

  - You are about to drop the column `authorityStory` on the `ICP` table. All the data in the column will be lost.
  - You are about to drop the column `clientDemographics` on the `ICP` table. All the data in the column will be lost.
  - You are about to drop the column `dreamClient` on the `ICP` table. All the data in the column will be lost.
  - You are about to drop the column `dreamOutcome` on the `ICP` table. All the data in the column will be lost.
  - You are about to drop the column `mainProblem` on the `ICP` table. All the data in the column will be lost.
  - You are about to drop the column `otherDetails` on the `ICP` table. All the data in the column will be lost.
  - You are about to drop the column `profession` on the `ICP` table. All the data in the column will be lost.
  - You are about to drop the column `lastAttemptAt` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `facebookId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `instagramId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `linkedInId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tiktokId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `twitterId` on the `User` table. All the data in the column will be lost.
  - Added the required column `audienceDescription` to the `ICP` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `ICP` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ICPType" AS ENUM ('BUSINESS', 'CREATOR');

-- DropIndex
DROP INDEX "User_facebookId_key";

-- DropIndex
DROP INDEX "User_instagramId_key";

-- DropIndex
DROP INDEX "User_linkedInId_key";

-- DropIndex
DROP INDEX "User_tiktokId_key";

-- DropIndex
DROP INDEX "User_twitterId_key";

-- AlterTable
ALTER TABLE "ICP" DROP COLUMN "authorityStory",
DROP COLUMN "clientDemographics",
DROP COLUMN "dreamClient",
DROP COLUMN "dreamOutcome",
DROP COLUMN "mainProblem",
DROP COLUMN "otherDetails",
DROP COLUMN "profession",
ADD COLUMN     "additional" TEXT,
ADD COLUMN     "audienceDescription" TEXT NOT NULL,
ADD COLUMN     "backstory" TEXT,
ADD COLUMN     "contentTopic" TEXT,
ADD COLUMN     "demographics" TEXT,
ADD COLUMN     "desiredOutcome" TEXT,
ADD COLUMN     "goal" TEXT,
ADD COLUMN     "motivation" TEXT,
ADD COLUMN     "painPoint" TEXT,
ADD COLUMN     "type" "ICPType" NOT NULL;

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "lastAttemptAt",
ALTER COLUMN "platforms" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "facebookId",
DROP COLUMN "instagramId",
DROP COLUMN "linkedInId",
DROP COLUMN "tiktokId",
DROP COLUMN "twitterId";

-- CreateTable
CREATE TABLE "connectedAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "twitterId" TEXT,
    "facebookId" TEXT,
    "linkedInId" TEXT,
    "tiktokId" TEXT,
    "instagramId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connectedAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "connectedAccount_twitterId_key" ON "connectedAccount"("twitterId");

-- CreateIndex
CREATE UNIQUE INDEX "connectedAccount_facebookId_key" ON "connectedAccount"("facebookId");

-- CreateIndex
CREATE UNIQUE INDEX "connectedAccount_linkedInId_key" ON "connectedAccount"("linkedInId");

-- CreateIndex
CREATE UNIQUE INDEX "connectedAccount_tiktokId_key" ON "connectedAccount"("tiktokId");

-- CreateIndex
CREATE UNIQUE INDEX "connectedAccount_instagramId_key" ON "connectedAccount"("instagramId");

-- AddForeignKey
ALTER TABLE "connectedAccount" ADD CONSTRAINT "connectedAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
