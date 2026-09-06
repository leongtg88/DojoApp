-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "memberNumber" TEXT;

-- AlterTable
ALTER TABLE "StudentRankHistory" ADD COLUMN     "examinerName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Student_memberNumber_key" ON "Student"("memberNumber");
