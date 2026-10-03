-- Agrega el estado ABSENT al enum de asistencia: faltas marcadas explícitamente
-- por instructor/admin, distintas de un punch rechazado (REJECTED).
ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'ABSENT';
