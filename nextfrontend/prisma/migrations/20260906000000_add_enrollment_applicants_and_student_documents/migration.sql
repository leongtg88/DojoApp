-- CreateEnum
CREATE TYPE "StudentDocumentType" AS ENUM ('PROFILE_PHOTO', 'IDENTITY', 'BIRTH_CERTIFICATE', 'PASSPORT', 'MEDICAL_CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "StudentDocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN "registrationData" JSONB;
ALTER TABLE "Student" ADD COLUMN "registrationData" JSONB;

-- CreateTable
CREATE TABLE "EnrollmentApplicant" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "studentId" TEXT,
    "name" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "profileData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrollmentApplicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentDocument" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "applicantId" TEXT,
    "studentId" TEXT,
    "type" "StudentDocumentType" NOT NULL,
    "status" "StudentDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentApplicant_studentId_key" ON "EnrollmentApplicant"("studentId");
CREATE INDEX "EnrollmentApplicant_enrollmentId_idx" ON "EnrollmentApplicant"("enrollmentId");
CREATE UNIQUE INDEX "StudentDocument_storageKey_key" ON "StudentDocument"("storageKey");
CREATE INDEX "StudentDocument_applicantId_idx" ON "StudentDocument"("applicantId");
CREATE INDEX "StudentDocument_studentId_status_idx" ON "StudentDocument"("studentId", "status");

-- AddForeignKey
ALTER TABLE "EnrollmentApplicant" ADD CONSTRAINT "EnrollmentApplicant_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EnrollmentApplicant" ADD CONSTRAINT "EnrollmentApplicant_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentDocument" ADD CONSTRAINT "StudentDocument_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentDocument" ADD CONSTRAINT "StudentDocument_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "EnrollmentApplicant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentDocument" ADD CONSTRAINT "StudentDocument_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;