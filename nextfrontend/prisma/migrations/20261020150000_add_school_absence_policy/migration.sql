-- Política de reposición por escuela: qué pasa con el derecho a examen cuando
-- el cuatrimestre cierra con faltas 3.ª+ sin reponer y el alumno repone después.

-- CreateEnum
CREATE TYPE "AbsencePostClosePolicy" AS ENUM ('LOCK_AT_CLOSE', 'RESTORE_ON_RECOVERY');

-- CreateTable
CREATE TABLE "SchoolAbsencePolicy" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "policy" "AbsencePostClosePolicy" NOT NULL DEFAULT 'LOCK_AT_CLOSE',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolAbsencePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SchoolAbsencePolicy_schoolId_effectiveFrom_idx" ON "SchoolAbsencePolicy"("schoolId", "effectiveFrom");

-- AddForeignKey
ALTER TABLE "SchoolAbsencePolicy" ADD CONSTRAINT "SchoolAbsencePolicy_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
