-- CreateEnum
CREATE TYPE "PROVIDER" AS ENUM ('LOCAL', 'GOOGLE', 'FACEBOOK', 'TWITTER');

-- CreateEnum
CREATE TYPE "ICPType" AS ENUM ('BUSINESS', 'CREATOR');

-- CreateEnum
CREATE TYPE "PLATFORM" AS ENUM ('TWITTER', 'LINKEDIN', 'FACEBOOK', 'INSTAGRAM', 'TIKTOK');

-- CreateEnum
CREATE TYPE "POST_STATUS" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'IDEA', 'SCRIPTING', 'RECORDING', 'EDITING', 'POSTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT,
    "provider" "PROVIDER"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "googleId" TEXT,
    "refreshToken" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "passwordResetToken" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Otp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ICP" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "additional" TEXT,
    "backstory" TEXT,
    "contentTopic" TEXT,
    "demographics" TEXT,
    "desiredOutcome" TEXT,
    "goal" TEXT,
    "type" "ICPType" NOT NULL,
    "audience" TEXT NOT NULL,
    "problem" TEXT,
    "profession" TEXT,

    CONSTRAINT "ICP_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "mediaUrls" TEXT[],
    "platformContent" JSONB,
    "externalPostIds" JSONB,
    "status" "POST_STATUS" NOT NULL DEFAULT 'IDEA',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "platforms" "PLATFORM"[],

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_refreshToken_key" ON "User"("refreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");

-- CreateIndex
CREATE UNIQUE INDEX "Otp_userId_key" ON "Otp"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ICP_userId_key" ON "ICP"("userId");

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
ALTER TABLE "Otp" ADD CONSTRAINT "Otp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ICP" ADD CONSTRAINT "ICP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connectedAccount" ADD CONSTRAINT "connectedAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
