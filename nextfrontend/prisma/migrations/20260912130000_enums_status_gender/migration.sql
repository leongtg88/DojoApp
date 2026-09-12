-- Sanitización antes del cast (evita fallos con datos legacy)
UPDATE "Student" SET "status" = 'ACTIVE' WHERE "status" NOT IN ('ACTIVE', 'INACTIVE', 'GRADUATED');
UPDATE "Enrollment" SET "status" = 'PENDING' WHERE "status" NOT IN ('PENDING', 'CONTACTED', 'ENROLLED', 'REJECTED');
UPDATE "ClassEnrollment" SET "status" = 'ACTIVE' WHERE "status" NOT IN ('ACTIVE', 'PAUSED', 'COMPLETED');
UPDATE "StudentAchievement" SET "status" = 'PENDING' WHERE "status" NOT IN ('PENDING', 'APPROVED', 'REJECTED');
UPDATE "FitnessReport" SET "status" = 'PENDING' WHERE "status" NOT IN ('PENDING', 'APPROVED', 'REJECTED');

UPDATE "Student" SET "gender" = 'MALE' WHERE "gender" = 'male';
UPDATE "Student" SET "gender" = 'FEMALE' WHERE "gender" = 'female';
UPDATE "Student" SET "gender" = 'OTHER' WHERE "gender" = 'other';
UPDATE "Student" SET "gender" = NULL WHERE "gender" NOT IN ('MALE', 'FEMALE', 'OTHER') AND "gender" IS NOT NULL;

-- Crear tipos enumerados (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StudentStatus') THEN
    CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'GRADUATED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EnrollmentStatus') THEN
    CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING', 'CONTACTED', 'ENROLLED', 'REJECTED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ClassEnrollmentStatus') THEN
    CREATE TYPE "ClassEnrollmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ApprovalStatus') THEN
    CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Gender') THEN
    CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');
  END IF;
END $$;

-- Cast de columnas (DROP DEFAULT primero; se re-añade tras el cast)
ALTER TABLE "Student" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Enrollment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ClassEnrollment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "StudentAchievement" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "FitnessReport" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Student" ALTER COLUMN "status" TYPE "StudentStatus" USING "status"::"StudentStatus";
ALTER TABLE "Enrollment" ALTER COLUMN "status" TYPE "EnrollmentStatus" USING "status"::"EnrollmentStatus";
ALTER TABLE "ClassEnrollment" ALTER COLUMN "status" TYPE "ClassEnrollmentStatus" USING "status"::"ClassEnrollmentStatus";
ALTER TABLE "StudentAchievement" ALTER COLUMN "status" TYPE "ApprovalStatus" USING "status"::"ApprovalStatus";
ALTER TABLE "FitnessReport" ALTER COLUMN "status" TYPE "ApprovalStatus" USING "status"::"ApprovalStatus";
ALTER TABLE "Student" ALTER COLUMN "gender" TYPE "Gender" USING "gender"::"Gender";

ALTER TABLE "Student" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
ALTER TABLE "Enrollment" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "ClassEnrollment" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
ALTER TABLE "StudentAchievement" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "FitnessReport" ALTER COLUMN "status" SET DEFAULT 'PENDING';
