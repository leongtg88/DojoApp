-- Agregar estado ENDED a ClassEnrollmentStatus (usado para desinscribir del horario)
ALTER TYPE "ClassEnrollmentStatus" ADD VALUE 'ENDED' BEFORE 'COMPLETED';