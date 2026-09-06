-- DropIndex
DROP INDEX "Enrollment_branchId_status_idx";

-- DropIndex
DROP INDEX "Enrollment_schoolId_status_idx";

-- CreateTable
CREATE TABLE "TechniqueEvaluation" (
    "id" TEXT NOT NULL,
    "studentTechniqueId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "feedback" TEXT,
    "evaluatedBy" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechniqueEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TechniqueEvaluation_studentTechniqueId_key" ON "TechniqueEvaluation"("studentTechniqueId");

-- CreateIndex
CREATE INDEX "TechniqueEvaluation_evaluatedBy_evaluatedAt_idx" ON "TechniqueEvaluation"("evaluatedBy", "evaluatedAt");

-- AddForeignKey
ALTER TABLE "TechniqueEvaluation" ADD CONSTRAINT "TechniqueEvaluation_studentTechniqueId_fkey" FOREIGN KEY ("studentTechniqueId") REFERENCES "StudentTechnique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechniqueEvaluation" ADD CONSTRAINT "TechniqueEvaluation_evaluatedBy_fkey" FOREIGN KEY ("evaluatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
