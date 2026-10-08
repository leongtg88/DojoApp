-- AlterTable
ALTER TABLE "TechniqueEvaluation" ADD COLUMN     "criteria" JSONB,
ALTER COLUMN "score" SET DATA TYPE DOUBLE PRECISION;
