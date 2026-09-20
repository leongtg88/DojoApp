-- CreateEnum
CREATE TYPE "PracticePlace" AS ENUM ('DOJO', 'FUERA');

-- AlterTable
ALTER TABLE "StudentTechnique" ADD COLUMN     "practiceRepetitions" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "TechniquePracticeLog" (
    "id" TEXT NOT NULL,
    "studentTechniqueId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repetitions" INTEGER NOT NULL,
    "place" "PracticePlace" NOT NULL DEFAULT 'DOJO',
    "notes" TEXT,
    "attendanceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechniquePracticeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TechniquePracticeLog_studentTechniqueId_date_idx" ON "TechniquePracticeLog"("studentTechniqueId", "date");

-- CreateIndex
CREATE INDEX "TechniquePracticeLog_attendanceId_idx" ON "TechniquePracticeLog"("attendanceId");

-- AddForeignKey
ALTER TABLE "TechniquePracticeLog" ADD CONSTRAINT "TechniquePracticeLog_studentTechniqueId_fkey" FOREIGN KEY ("studentTechniqueId") REFERENCES "StudentTechnique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechniquePracticeLog" ADD CONSTRAINT "TechniquePracticeLog_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
