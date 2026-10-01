import { db } from '@/lib/db'
import { notifyAssignment } from '@/lib/notifications/create'
import { scopeSchoolFilter, type AdminScope } from '@/lib/dashboard/scope'
import { ClassEnrollmentStatus, StudentStatus } from '@/lib/generated/prisma'

export interface AssignGroup {
  type: 'ALL' | 'GRADE' | 'BRANCH' | 'CLASS'
  value?: string
}

/**
 * Asigna una técnica al expediente de un conjunto de alumnos concretos.
 * Es idempotente (`skipDuplicates`) y notifica a cada alumno que recibe una
 * asignación nueva. Devuelve el número de alumnos efectivamente asignados.
 */
export async function assignTechniqueToStudentsByIds({
  scope,
  techniqueId,
  studentIds,
}: {
  scope: AdminScope
  techniqueId: string
  studentIds: string[]
}): Promise<number> {
  const uniqueIds = [...new Set(studentIds)]

  if (uniqueIds.length === 0) {
    return 0
  }

  const students = await db.student.findMany({
    where: { id: { in: uniqueIds }, ...scopeSchoolFilter(scope), status: StudentStatus.ACTIVE },
    select: { id: true },
  })

  let studentsAssigned = 0

  for (const student of students) {
    const creation = await db.studentTechnique.createMany({
      data: [{ studentId: student.id, techniqueId }],
      skipDuplicates: true,
    })

    if (creation.count > 0) {
      studentsAssigned += 1
      await notifyAssignment({ type: 'TECHNIQUES_ASSIGNED', studentId: student.id, count: 1 })
    }
  }

  return studentsAssigned
}

/**
 * Asigna una técnica al expediente de todos los alumnos activos que cumplen el
 * grupo indicado (todos, por grado, por sucursal o por clase) dentro del alcance.
 */
export async function assignTechniqueToStudentGroup({
  scope,
  techniqueId,
  group,
}: {
  scope: AdminScope
  techniqueId: string
  group: AssignGroup
}): Promise<number> {
  if (group.type !== 'ALL' && !group.value) {
    return 0
  }

  const targetFilter =
    group.type === 'GRADE'
      ? { currentRank: group.value }
      : group.type === 'BRANCH'
        ? { branch: { name: group.value } }
        : group.type === 'CLASS'
          ? { classEnrollments: { some: { status: ClassEnrollmentStatus.ACTIVE, class: { name: group.value } } } }
          : {}

  const students = await db.student.findMany({
    where: { ...scopeSchoolFilter(scope), status: StudentStatus.ACTIVE, ...targetFilter },
    select: { id: true },
  })

  let studentsAssigned = 0

  for (const student of students) {
    const creation = await db.studentTechnique.createMany({
      data: [{ studentId: student.id, techniqueId }],
      skipDuplicates: true,
    })

    if (creation.count > 0) {
      studentsAssigned += 1
      await notifyAssignment({ type: 'TECHNIQUES_ASSIGNED', studentId: student.id, count: 1 })
    }
  }

  return studentsAssigned
}
