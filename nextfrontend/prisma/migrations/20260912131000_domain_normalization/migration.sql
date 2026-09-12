-- R2: backfill de roles[] desde el escalar role y eliminar la columna
UPDATE "User" SET "roles" = ARRAY[role] WHERE cardinality("roles") = 0 AND "role" IS NOT NULL;
ALTER TABLE "User" DROP COLUMN "role";

-- R3: grado actual como FK con backfill desde el último StudentRankHistory
ALTER TABLE "Student" ADD COLUMN "currentRankId" TEXT;
UPDATE "Student" SET "currentRankId" = sub."beltRankId"
FROM (
  SELECT DISTINCT ON ("studentId") "studentId", "beltRankId"
  FROM "StudentRankHistory"
  ORDER BY "studentId", "promotedAt" DESC
) AS sub
WHERE sub."studentId" = "Student"."id";
ALTER TABLE "Student" ADD CONSTRAINT "Student_currentRankId_fkey" FOREIGN KEY ("currentRankId") REFERENCES "BeltRank"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Student_currentRankId_idx" ON "Student"("currentRankId");

-- R4: índices tenant/dashboard
CREATE INDEX "Student_branchId_idx" ON "Student"("branchId");
CREATE INDEX "Student_schoolId_idx" ON "Student"("schoolId");
CREATE INDEX "Student_status_idx" ON "Student"("status");
CREATE INDEX "Student_branchId_status_idx" ON "Student"("branchId", "status");
CREATE INDEX "User_schoolId_idx" ON "User"("schoolId");
CREATE INDEX "User_branchId_idx" ON "User"("branchId");

-- R6: catálogo de grados — unique global + por escuela (índices parciales)
ALTER TABLE "BeltRank" DROP CONSTRAINT IF EXISTS "BeltRank_program_order_key";
CREATE UNIQUE INDEX "BeltRank_program_order_global_key" ON "BeltRank"("program", "order") WHERE "schoolId" IS NULL;
CREATE UNIQUE INDEX "BeltRank_schoolId_program_order_key" ON "BeltRank"("schoolId", "program", "order") WHERE "schoolId" IS NOT NULL;

-- R13: logros — unique global + por escuela + índice por escuela
CREATE INDEX "AchievementType_schoolId_idx" ON "AchievementType"("schoolId");
CREATE UNIQUE INDEX "AchievementType_name_global_key" ON "AchievementType"("name") WHERE "schoolId" IS NULL;
CREATE UNIQUE INDEX "AchievementType_schoolId_name_key" ON "AchievementType"("schoolId", "name") WHERE "schoolId" IS NOT NULL;

-- R7: técnica deja de tener grado directo (BeltRankKata es el catálogo M:N canónico)
ALTER TABLE "Technique" DROP COLUMN "rankId";