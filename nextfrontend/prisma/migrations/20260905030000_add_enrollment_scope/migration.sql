-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN "schoolId" TEXT;
ALTER TABLE "Enrollment" ADD COLUMN "branchId" TEXT;
ALTER TABLE "Enrollment" ADD COLUMN "applicantName" TEXT;

-- CreateIndex
CREATE INDEX "Enrollment_schoolId_status_idx" ON "Enrollment"("schoolId", "status");

-- CreateIndex
CREATE INDEX "Enrollment_branchId_status_idx" ON "Enrollment"("branchId", "status");

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;