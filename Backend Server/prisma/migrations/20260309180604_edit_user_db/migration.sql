/*
  Warnings:

  - A unique constraint covering the columns `[twitterId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[facebookId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[linkedInId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tiktokId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[instagramId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "facebookId" TEXT,
ADD COLUMN     "instagramId" TEXT,
ADD COLUMN     "linkedInId" TEXT,
ADD COLUMN     "tiktokId" TEXT,
ADD COLUMN     "twitterId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_twitterId_key" ON "User"("twitterId");

-- CreateIndex
CREATE UNIQUE INDEX "User_facebookId_key" ON "User"("facebookId");

-- CreateIndex
CREATE UNIQUE INDEX "User_linkedInId_key" ON "User"("linkedInId");

-- CreateIndex
CREATE UNIQUE INDEX "User_tiktokId_key" ON "User"("tiktokId");

-- CreateIndex
CREATE UNIQUE INDEX "User_instagramId_key" ON "User"("instagramId");
