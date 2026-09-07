-- AlterTable
ALTER TABLE "Attendance" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "BeltRank" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "email" TEXT;

-- AlterTable
ALTER TABLE "Technique" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "StudentInvitationToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentInvitationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentInvitationToken_token_key" ON "StudentInvitationToken"("token");

-- CreateIndex
CREATE INDEX "StudentInvitationToken_studentId_idx" ON "StudentInvitationToken"("studentId");

-- CreateIndex
CREATE INDEX "StudentInvitationToken_expiresAt_idx" ON "StudentInvitationToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "StudentInvitationToken" ADD CONSTRAINT "StudentInvitationToken_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentInvitationToken" ADD CONSTRAINT "StudentInvitationToken_usedByUserId_fkey" FOREIGN KEY ("usedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
