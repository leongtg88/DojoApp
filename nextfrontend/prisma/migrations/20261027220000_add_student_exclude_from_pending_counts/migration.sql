-- UX-B5.1 · Campo aditivo para excluir un expediente de los pendientes
-- "sin plan / sin horario". No modifica ni borra datos existentes.
ALTER TABLE "Student" ADD COLUMN "excludeFromPendingCounts" BOOLEAN NOT NULL DEFAULT false;
