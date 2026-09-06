/*
  Warnings:

  - Added the required column `updatedAt` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `BeltRank` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Technique` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_sessionId_fkey";

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "confirmedById" TEXT,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "hoursTrained" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "punchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sessionType" TEXT,
ADD COLUMN     "status" "AttendanceStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "sessionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "BeltRank" ADD COLUMN     "beltColor" TEXT,
ADD COLUMN     "beltSecondaryColor" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "estimatedDurationMonths" INTEGER,
ADD COLUMN     "isMaximumRank" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "japaneseName" TEXT,
ADD COLUMN     "kanji" TEXT,
ADD COLUMN     "kyuDan" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Technique" ADD COLUMN     "difficulty" TEXT,
ADD COLUMN     "embusen" TEXT,
ADD COLUMN     "japaneseName" TEXT,
ADD COLUMN     "kanji" TEXT,
ADD COLUMN     "movementsCount" INTEGER,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "videoUrl" TEXT;

-- CreateIndex
CREATE INDEX "Attendance_studentId_date_idx" ON "Attendance"("studentId", "date");

-- CreateIndex
CREATE INDEX "Attendance_status_date_idx" ON "Attendance"("status", "date");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
