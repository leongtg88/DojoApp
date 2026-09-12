-- R4: índices tenant sobre Enrollment
CREATE INDEX "Enrollment_status_idx" ON "Enrollment"("status");
CREATE INDEX "Enrollment_branchId_status_idx" ON "Enrollment"("branchId", "status");

-- R5: búsqueda de tokens por usuario
CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");

-- R8: horarios como TIME nativo (orden/cálculos en SQL)
ALTER TABLE "Class" ALTER COLUMN "startTime" TYPE TIME USING "startTime"::time;
ALTER TABLE "Class" ALTER COLUMN "endTime" TYPE TIME USING "endTime"::time;

-- R11: deduplicar punch-ins fuera de horario por (alumno, día calendario)
CREATE UNIQUE INDEX "Attendance_student_day_outschedule_unique" ON "Attendance"("studentId", (("date")::date)) WHERE "sessionId" IS NULL;