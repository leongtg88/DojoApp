-- Reposición de faltas mediante clase online de 35 min acordada.

-- CreateEnum
CREATE TYPE "OnlineRecoveryStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "OnlineRecovery" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "absenceId" TEXT NOT NULL,
    "status" "OnlineRecoveryStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 35,
    "instructorId" TEXT,
    "meetingUrl" TEXT,
    "costAmount" DECIMAL(10,2),
    "costCurrency" TEXT NOT NULL DEFAULT 'DOP',
    "costNote" TEXT,
    "costInformedAt" TIMESTAMP(3),
    "attendanceId" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnlineRecovery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnlineRecovery_absenceId_key" ON "OnlineRecovery"("absenceId");

-- CreateIndex
CREATE UNIQUE INDEX "OnlineRecovery_attendanceId_key" ON "OnlineRecovery"("attendanceId");

-- CreateIndex
CREATE INDEX "OnlineRecovery_studentId_status_idx" ON "OnlineRecovery"("studentId", "status");

-- CreateIndex
CREATE INDEX "OnlineRecovery_scheduledAt_idx" ON "OnlineRecovery"("scheduledAt");

-- CreateIndex
CREATE INDEX "OnlineRecovery_instructorId_idx" ON "OnlineRecovery"("instructorId");

-- AddForeignKey
ALTER TABLE "OnlineRecovery" ADD CONSTRAINT "OnlineRecovery_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnlineRecovery" ADD CONSTRAINT "OnlineRecovery_absenceId_fkey" FOREIGN KEY ("absenceId") REFERENCES "Attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnlineRecovery" ADD CONSTRAINT "OnlineRecovery_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnlineRecovery" ADD CONSTRAINT "OnlineRecovery_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnlineRecovery" ADD CONSTRAINT "OnlineRecovery_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
