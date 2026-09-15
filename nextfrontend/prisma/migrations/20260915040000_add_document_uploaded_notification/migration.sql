-- Agregar tipo DOCUMENT_UPLOADED a NotificationType (notifica a los admins
-- de la escuela cuando un alumno sube un documento para revisar)
ALTER TYPE "NotificationType" ADD VALUE 'DOCUMENT_UPLOADED' BEFORE 'ATTENDANCE_CONFIRMED';
