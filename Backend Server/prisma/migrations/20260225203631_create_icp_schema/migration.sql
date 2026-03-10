-- CreateTable
CREATE TABLE "ICP" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profession" TEXT NOT NULL,
    "dreamClient" TEXT NOT NULL,
    "mainProblem" TEXT NOT NULL,
    "dreamOutcome" TEXT NOT NULL,
    "authorityStory" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ICP_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ICP_userId_key" ON "ICP"("userId");

-- AddForeignKey
ALTER TABLE "ICP" ADD CONSTRAINT "ICP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
