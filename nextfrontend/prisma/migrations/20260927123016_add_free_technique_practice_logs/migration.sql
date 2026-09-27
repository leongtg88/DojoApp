-- AlterTable
ALTER TABLE "TechniquePracticeLog" ADD COLUMN     "studentId" TEXT,
ADD COLUMN     "techniqueId" TEXT,
ALTER COLUMN "studentTechniqueId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "TechniquePracticeLog_studentId_date_idx" ON "TechniquePracticeLog"("studentId", "date");

-- CreateIndex
CREATE INDEX "TechniquePracticeLog_techniqueId_idx" ON "TechniquePracticeLog"("techniqueId");

-- AddForeignKey
ALTER TABLE "TechniquePracticeLog" ADD CONSTRAINT "TechniquePracticeLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechniquePracticeLog" ADD CONSTRAINT "TechniquePracticeLog_techniqueId_fkey" FOREIGN KEY ("techniqueId") REFERENCES "Technique"("id") ON DELETE CASCADE ON UPDATE CASCADE;
