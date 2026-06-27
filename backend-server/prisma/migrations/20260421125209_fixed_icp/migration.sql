/*
  Warnings:

  - You are about to drop the column `audienceDescription` on the `ICP` table. All the data in the column will be lost.
  - You are about to drop the column `motivation` on the `ICP` table. All the data in the column will be lost.
  - You are about to drop the column `painPoint` on the `ICP` table. All the data in the column will be lost.
  - Added the required column `audience` to the `ICP` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ICP" DROP COLUMN "audienceDescription",
DROP COLUMN "motivation",
DROP COLUMN "painPoint",
ADD COLUMN     "audience" TEXT NOT NULL,
ADD COLUMN     "problem" TEXT,
ADD COLUMN     "profession" TEXT;
