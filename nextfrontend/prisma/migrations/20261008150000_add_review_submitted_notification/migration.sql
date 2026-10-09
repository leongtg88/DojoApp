-- Agregar tipo REVIEW_SUBMITTED a NotificationType (avisa al staff cuando
-- un padre/tutor deja una reseña desde la web pública).
ALTER TYPE "NotificationType" ADD VALUE 'REVIEW_SUBMITTED';
