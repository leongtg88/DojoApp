import { db } from '@/lib/db'

/** Convierte "HH:MM" al DateTime (Time) que Prisma usa para Class.startTime/endTime. */
export function timeToDate(value: string): Date {
  return new Date(`1970-01-01T${value}:00.000Z`)
}

/**
 * Busca otra franja activa del mismo instructor el mismo día cuya ventana horaria
 * se solape con la que se intenta guardar. Devuelve null si no hay conflicto.
 */
export async function findInstructorScheduleConflict(params: {
  dayOfWeek: number
  startTime: string
  endTime: string
  instructorId: string
  excludeClassId?: string
}) {
  const { dayOfWeek, startTime, endTime, instructorId, excludeClassId } = params

  return db.class.findFirst({
    where: {
      dayOfWeek,
      active: true,
      instructorId,
      ...(excludeClassId ? { id: { not: excludeClassId } } : {}),
      startTime: { lt: timeToDate(endTime) },
      endTime: { gt: timeToDate(startTime) },
    },
    select: { id: true, name: true, startTime: true, endTime: true },
  })
}
