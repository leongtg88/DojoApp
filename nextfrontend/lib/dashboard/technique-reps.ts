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

export interface RegisterPracticeLogsResult {
  /** Total de registros creados (asignados + libres). */
  created: number
  /** Registros libres de técnicas del catálogo aún no asignadas al expediente. */
  free: number
  /** Líneas descartadas por no pertenecer al catálogo disponible de la escuela. */
  invalid: number
}

/**
 * Registra repeticiones de técnicas. Si la técnica está asignada al alumno,
 * acumula el contador del expediente; si no lo está pero pertenece al catálogo
 * de su escuela, guarda un registro "libre" (diario) que no altera el
 * expediente ni las métricas de grado. Ignora técnicas ajenas a la escuela.
 */
export async function registerPracticeLogs(studentId: string, entries: PracticeLogInput[]): Promise<RegisterPracticeLogsResult> {
  if (entries.length === 0) return { created: 0, free: 0, invalid: 0 }

  const student = await db.student.findUnique({ where: { id: studentId }, select: { schoolId: true } })
  if (!student) return { created: 0, free: 0, invalid: entries.length }

  const techniqueIds = [...new Set(entries.map((entry) => entry.techniqueId))]
  const [assignments, availableTechniques] = await Promise.all([
    db.studentTechnique.findMany({
      where: { studentId, techniqueId: { in: techniqueIds } },
      select: { id: true, techniqueId: true },
    }),
    db.technique.findMany({
      where: { id: { in: techniqueIds }, OR: [{ schoolId: student.schoolId }, { schoolId: null }] },
      select: { id: true },
    }),
  ])
  const byTechnique = new Map(assignments.map((assignment) => [assignment.techniqueId, assignment.id]))
  const availableIds = new Set(availableTechniques.map(({ id }) => id))

  let created = 0
  let free = 0
  let invalid = 0

  await db.$transaction(async (transaction) => {
    for (const entry of entries) {
      if (entry.repetitions <= 0) continue
      if (!availableIds.has(entry.techniqueId)) {
        invalid += 1
        continue
      }

      const date = entry.date ?? new Date()
      const studentTechniqueId = byTechnique.get(entry.techniqueId)

      if (studentTechniqueId) {
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
      } else {
        await transaction.techniquePracticeLog.create({
          data: {
            studentId,
            techniqueId: entry.techniqueId,
            repetitions: entry.repetitions,
            place: entry.place,
            notes: entry.notes ?? null,
            attendanceId: entry.attendanceId ?? null,
            date,
          },
        })
        free += 1
      }

      created += 1
    }
  })

  return { created, free, invalid }
}

/**
 * Elimina un registro de práctica del alumno. Sólo ajusta el contador acumulado
 * cuando el registro pertenece a una técnica asignada (los registros libres no
 * tocan el expediente).
 */
export async function removePracticeLog(studentId: string, logId: string): Promise<boolean> {
  const log = await db.techniquePracticeLog.findFirst({
    where: { id: logId, OR: [{ studentTechnique: { studentId } }, { studentId }] },
    select: { id: true, studentTechniqueId: true, repetitions: true },
  })

  if (!log) return false

  if (log.studentTechniqueId) {
    await db.$transaction([
      db.techniquePracticeLog.delete({ where: { id: log.id } }),
      db.studentTechnique.update({
        where: { id: log.studentTechniqueId },
        data: { practiceRepetitions: { decrement: log.repetitions } },
      }),
    ])
  } else {
    await db.techniquePracticeLog.delete({ where: { id: log.id } })
  }

  return true
}
