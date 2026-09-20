import { db } from '@/lib/db'
import { PracticePlace } from '@/lib/generated/prisma'

/**
 * Objetivo de repeticiones de referencia del catálogo. No es vinculante para
 * el examen; kihon usa `repetitionsCount` y el resto `movementsCount`.
 */
export function targetRepetitionsFor(technique: {
  category: string
  repetitionsCount: number | null
  movementsCount: number | null
}): number | null {
  if (technique.category === 'KIHON') return technique.repetitionsCount ?? null
  return technique.movementsCount ?? null
}

export interface PracticeLogInput {
  techniqueId: string
  repetitions: number
  place: PracticePlace
  notes?: string | null
  attendanceId?: string | null
  date?: Date
}

/**
 * Registra repeticiones para las técnicas asignadas al alumno. Crea el historial
 * y actualiza el contador acumulado en la misma transacción. Ignora técnicas que
 * no estén asignadas al alumno.
 */
export async function registerPracticeLogs(studentId: string, entries: PracticeLogInput[]): Promise<number> {
  if (entries.length === 0) return 0

  const techniqueIds = [...new Set(entries.map((entry) => entry.techniqueId))]
  const assignments = await db.studentTechnique.findMany({
    where: { studentId, techniqueId: { in: techniqueIds } },
    select: { id: true, techniqueId: true },
  })
  const byTechnique = new Map(assignments.map((assignment) => [assignment.techniqueId, assignment.id]))

  let created = 0
  await db.$transaction(async (transaction) => {
    for (const entry of entries) {
      const studentTechniqueId = byTechnique.get(entry.techniqueId)
      if (!studentTechniqueId || entry.repetitions <= 0) continue

      const date = entry.date ?? new Date()
      await transaction.techniquePracticeLog.create({
        data: {
          studentTechniqueId,
          repetitions: entry.repetitions,
          place: entry.place,
          notes: entry.notes ?? null,
          attendanceId: entry.attendanceId ?? null,
          date,
        },
      })
      await transaction.studentTechnique.update({
        where: { id: studentTechniqueId },
        data: {
          practiceRepetitions: { increment: entry.repetitions },
          lastPracticeDate: date,
        },
      })
      created += 1
    }
  })

  return created
}

/** Elimina un registro de práctica del alumno y ajusta el contador acumulado. */
export async function removePracticeLog(studentId: string, logId: string): Promise<boolean> {
  const log = await db.techniquePracticeLog.findFirst({
    where: { id: logId, studentTechnique: { studentId } },
    select: { id: true, studentTechniqueId: true, repetitions: true },
  })

  if (!log) return false

  await db.$transaction([
    db.techniquePracticeLog.delete({ where: { id: log.id } }),
    db.studentTechnique.update({
      where: { id: log.studentTechniqueId },
      data: { practiceRepetitions: { decrement: log.repetitions } },
    }),
  ])

  return true
}
