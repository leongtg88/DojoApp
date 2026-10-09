-- Motivo de inasistencia reportado por el alumno y estado del pase de lista.

-- CreateEnum
CREATE TYPE "AbsenceJustificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "ClassSession" ADD COLUMN "takenById" TEXT,
ADD COLUMN "takenAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AbsenceJustification" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "AbsenceJustificationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbsenceJustification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassSession_takenAt_idx" ON "ClassSession"("takenAt");

-- CreateIndex
CREATE UNIQUE INDEX "AbsenceJustification_studentId_classId_date_key" ON "AbsenceJustification"("studentId", "classId", "date");

-- CreateIndex
CREATE INDEX "AbsenceJustification_classId_date_idx" ON "AbsenceJustification"("classId", "date");

-- CreateIndex
CREATE INDEX "AbsenceJustification_status_date_idx" ON "AbsenceJustification"("status", "date");

-- CreateIndex
CREATE INDEX "AbsenceJustification_studentId_date_idx" ON "AbsenceJustification"("studentId", "date");

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_takenById_fkey" FOREIGN KEY ("takenById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsenceJustification" ADD CONSTRAINT "AbsenceJustification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsenceJustification" ADD CONSTRAINT "AbsenceJustification_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsenceJustification" ADD CONSTRAINT "AbsenceJustification_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
