-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TECHNIQUES_ASSIGNED', 'TECHNIQUES_REMOVED', 'RANK_PROMOTED', 'KATAS_UNLOCKED', 'CLASS_ENROLLED', 'CLASS_REMOVED', 'PLAN_ASSIGNED', 'SCHOLARSHIP_ASSIGNED', 'DOCUMENT_APPROVED', 'DOCUMENT_REJECTED', 'ATTENDANCE_CONFIRMED', 'TECHNIQUE_APPROVED', 'TECHNIQUE_EVALUATED');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('INFO', 'ACTION', 'URGENT');

-- DropIndex
DROP INDEX "BeltRank_program_order_key";

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "data" JSONB,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'INFO',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_studentId_idx" ON "Notification"("studentId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
