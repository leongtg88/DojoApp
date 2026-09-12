-- C1: Cleanup de IDs de aprobador huérfanos antes de crear los FK
UPDATE "StudentTechnique" SET "approvedBy" = NULL
WHERE "approvedBy" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = "StudentTechnique"."approvedBy");

UPDATE "StudentAchievement" SET "approvedBy" = NULL
WHERE "approvedBy" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = "StudentAchievement"."approvedBy");

UPDATE "FitnessReport" SET "approvedBy" = NULL
WHERE "approvedBy" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = "FitnessReport"."approvedBy");

-- C1: Índices sobre approvedBy
CREATE INDEX "StudentTechnique_approvedBy_idx" ON "StudentTechnique"("approvedBy");
CREATE INDEX "StudentAchievement_approvedBy_idx" ON "StudentAchievement"("approvedBy");
CREATE INDEX "FitnessReport_approvedBy_idx" ON "FitnessReport"("approvedBy");

-- C1: Foreign keys hacia User
ALTER TABLE "StudentTechnique" ADD CONSTRAINT "StudentTechnique_approvedBy_fkey"
FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StudentAchievement" ADD CONSTRAINT "StudentAchievement_approvedBy_fkey"
FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FitnessReport" ADD CONSTRAINT "FitnessReport_approvedBy_fkey"
FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- C2: StudentDocument.enrollmentId pasa a ser opcional (SetNull en lugar de Cascade)
ALTER TABLE "StudentDocument" DROP CONSTRAINT "StudentDocument_enrollmentId_fkey";
ALTER TABLE "StudentDocument" ALTER COLUMN "enrollmentId" DROP NOT NULL;
ALTER TABLE "StudentDocument" ADD CONSTRAINT "StudentDocument_enrollmentId_fkey"
FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- C3: Plan.price pasa de DOUBLE PRECISION a DECIMAL(10,2) y se agrega moneda
ALTER TABLE "Plan" ALTER COLUMN "price" TYPE DECIMAL(10,2) USING "price"::numeric(10,2);
ALTER TABLE "Plan" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'DOP';