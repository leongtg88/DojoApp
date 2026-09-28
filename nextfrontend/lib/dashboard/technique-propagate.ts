import { db } from '@/lib/db'
import { StudentStatus } from '@/lib/generated/prisma'
import { notifyAssignment } from '@/lib/notifications/create'
import { scopeSchoolFilter, type AdminScope } from '@/lib/dashboard/scope'

interface RankIdentity {
  id: string
  name: string
}

/**
 * Alumnos activos del grado indicado dentro del alcance del admin. Se resuelve
 * por `currentRankId` (vínculo preciso) y, como respaldo, por el nombre
 * denormalizado `currentRank` para expedientes antiguos sin FK.
 */
export async function findActiveStudentsInRank(scope: AdminScope, rank: RankIdentity) {
  return db.student.findMany({
    where: {
      ...scopeSchoolFilter(scope),
      status: StudentStatus.ACTIVE,
      OR: [{ currentRankId: rank.id }, { currentRank: rank.name, currentRankId: null }],
    },
    select: { id: true },
  })
}

/**
 * Asigna técnicas del catálogo al expediente de todos los alumnos activos del
 * grado. Sólo crea las asignaciones que faltan (`skipDuplicates`) y notifica a
 * cada alumno que reciba al menos una técnica nueva. Es idempotente y
 * "best-effort": las notificaciones nunca rompen el flujo de guardado.
 */
export async function propagateTechniquesToRankStudents({
  scope,
  rank,
  techniqueIds,
}: {
  scope: AdminScope
  rank: RankIdentity
  techniqueIds: string[]
}): Promise<{ studentsProcessed: number; studentsAssigned: number; linksAdded: number }> {
  const uniqueIds = [...new Set(techniqueIds)]

  if (uniqueIds.length === 0) {
    return { studentsProcessed: 0, studentsAssigned: 0, linksAdded: 0 }
  }

  const students = await findActiveStudentsInRank(scope, rank)

  if (students.length === 0) {
    return { studentsProcessed: 0, studentsAssigned: 0, linksAdded: 0 }
  }

  let linksAdded = 0
  const assignments: { studentId: string; added: number }[] = []

  for (const student of students) {
    const creation = await db.studentTechnique.createMany({
      data: uniqueIds.map((techniqueId) => ({ studentId: student.id, techniqueId })),
      skipDuplicates: true,
    })

    linksAdded += creation.count

    if (creation.count > 0) {
      assignments.push({ studentId: student.id, added: creation.count })
    }
  }

  await Promise.all(
    assignments.map((assignment) =>
      notifyAssignment({ type: 'TECHNIQUES_ASSIGNED', studentId: assignment.studentId, count: assignment.added }),
    ),
  )

  return { studentsProcessed: students.length, studentsAssigned: assignments.length, linksAdded }
}
