-- CreateEnum
CREATE TYPE "ClassAudience" AS ENUM ('ADULTS', 'CHILDREN', 'MIXED');

-- CreateEnum
CREATE TYPE "ScholarshipType" AS ENUM ('NONE', 'ECONOMIC', 'MERIT', 'COMPETITOR');

-- AlterEnum
ALTER TYPE "AttendanceStatus" ADD VALUE 'JUSTIFIED';

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "classId" TEXT,
ADD COLUMN     "isOutOfSchedule" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recoveredById" TEXT;

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "audience" "ClassAudience" NOT NULL DEFAULT 'MIXED';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "isCompetitor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "planId" TEXT,
ADD COLUMN     "planStartDate" TIMESTAMP(3),
ADD COLUMN     "scholarshipNote" TEXT,
ADD COLUMN     "scholarshipType" "ScholarshipType" NOT NULL DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price" DOUBLE PRECISION,
    "isUnlimited" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "schoolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Plan_active_sortOrder_idx" ON "Plan"("active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_recoveredById_key" ON "Attendance"("recoveredById");

-- CreateIndex
CREATE INDEX "Attendance_classId_idx" ON "Attendance"("classId");

-- CreateIndex
CREATE INDEX "Attendance_isOutOfSchedule_idx" ON "Attendance"("isOutOfSchedule");

-- CreateIndex
CREATE INDEX "Class_branchId_active_idx" ON "Class"("branchId", "active");

-- CreateIndex
CREATE INDEX "Student_planId_idx" ON "Student"("planId");

-- CreateIndex
CREATE INDEX "Student_scholarshipType_idx" ON "Student"("scholarshipType");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_recoveredById_fkey" FOREIGN KEY ("recoveredById") REFERENCES "Attendance"("id") ON DELETE SET NULL ON UPDATE CASCADE;