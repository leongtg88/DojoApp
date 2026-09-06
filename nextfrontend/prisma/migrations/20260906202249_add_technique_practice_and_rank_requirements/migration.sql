-- AlterTable
ALTER TABLE "BeltRank" ADD COLUMN     "minAttendancePercent" INTEGER,
ADD COLUMN     "minMonths" INTEGER;

-- AlterTable
ALTER TABLE "StudentTechnique" ADD COLUMN     "inPractice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastPracticeDate" TIMESTAMP(3),
ADD COLUMN     "practiceHours" DOUBLE PRECISION NOT NULL DEFAULT 0;
