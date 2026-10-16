import { db } from '@/lib/db'
import { notifyAssignment } from '@/lib/notifications/create'
import { scopeSchoolFilter, type AdminScope } from '@/lib/dashboard/scope'
import { ClassEnrollmentStatus, StudentStatus } from '@/lib/generated/prisma'

export interface AssignGroup {
  type: 'ALL' | 'GRADE' | 'BRANCH' | 'CLASS'
  value?: string
}

export type AssignTarget =
  | { kind: 'STUDENT'; studentIds: string[] }
  | { kind: 'GROUP'; group: AssignGroup }

export interface AssignResult {
  /** Alumnos que recibieron al menos una técnica nueva. */
  studentsAssigned: number
  /** Total de técnicas nuevas enlazadas a expedientes. */
  linksAdded: number
}

function groupFilter(group: AssignGroup) {
  return group.type === 'GRADE'
    ? { currentRank: group.value }
    : group.type === 'BRANCH'
      ? { branch: { name: group.value } }
      : group.type === 'CLASS'
        ? { classEnrollments: { some: { status: ClassEnrollmentStatus.ACTIVE, class: { name: group.value } } } }
        : {}
}

/**
 * Aplica un conjunto de técnicas al expediente de una lista de alumnos.
 * Idempotente (`skipDuplicates`): sólo notifica a los alumnos que reciben algo
 * nuevo y acumula el conteo real de enlaces creados.
 */
async function applyTechniquesToStudents(studentIds: string[], techniqueIds: string[]): Promise<AssignResult> {
  let studentsAssigned = 0
  let linksAdded = 0

  for (const studentId of studentIds) {
    const creation = await db.studentTechnique.createMany({
      data: techniqueIds.map((techniqueId) => ({ studentId, techniqueId })),
      skipDuplicates: true,
    })

    if (creation.count > 0) {
      studentsAssigned += 1
      linksAdded += creation.count
      await notifyAssignment({ type: 'TECHNIQUES_ASSIGNED', studentId, count: creation.count })
    }
  }

  return { studentsAssigned, linksAdded }
}

/**
 * Asigna un conjunto de técnicas al expediente de un conjunto de alumnos concretos
 * (por id) dentro del alcance.
 */
export async function assignTechniquesToStudentsByIds({
  scope,
  techniqueIds,
  studentIds,
}: {
  scope: AdminScope
  techniqueIds: string[]
  studentIds: string[]
}): Promise<AssignResult> {
  const uniqueTechniqueIds = [...new Set(techniqueIds)]
  const uniqueStudentIds = [...new Set(studentIds)]

  if (uniqueTechniqueIds.length === 0 || uniqueStudentIds.length === 0) {
    return { studentsAssigned: 0, linksAdded: 0 }
  }

  const students = await db.student.findMany({
    where: { id: { in: uniqueStudentIds }, ...scopeSchoolFilter(scope), status: StudentStatus.ACTIVE },
    select: { id: true },
  })

  return applyTechniquesToStudents(students.map((student) => student.id), uniqueTechniqueIds)
}

/**
 * Asigna un conjunto de técnicas al expediente de todos los alumnos activos que
 * cumplen el grupo indicado (todos, por grado, por sucursal o por clase).
 */
export async function assignTechniquesToStudentGroup({
  scope,
  techniqueIds,
  group,
}: {
  scope: AdminScope
  techniqueIds: string[]
  group: AssignGroup
}): Promise<AssignResult> {
  const uniqueTechniqueIds = [...new Set(techniqueIds)]

  if (uniqueTechniqueIds.length === 0) {
    return { studentsAssigned: 0, linksAdded: 0 }
  }

  if (group.type !== 'ALL' && !group.value) {
    return { studentsAssigned: 0, linksAdded: 0 }
  }

  const students = await db.student.findMany({
    where: { ...scopeSchoolFilter(scope), status: StudentStatus.ACTIVE, ...groupFilter(group) },
    select: { id: true },
  })

  return applyTechniquesToStudents(students.map((student) => student.id), uniqueTechniqueIds)
}

/**
 * Aplica un conjunto de técnicas a uno o varios destinos (alumnos concretos y/o
 * grupos) y devuelve los totales combinados. Usado por los endpoints de asignación
 * masiva del instructor y del administrador.
 */
export async function assignTechniquesToTargets({
  scope,
  techniqueIds,
  targets,
}: {
  scope: AdminScope
  techniqueIds: string[]
  targets: AssignTarget[]
}): Promise<AssignResult> {
  let studentsAssigned = 0
  let linksAdded = 0

  for (const target of targets) {
    const summary = target.kind === 'STUDENT'
      ? await assignTechniquesToStudentsByIds({ scope, techniqueIds, studentIds: target.studentIds })
      : await assignTechniquesToStudentGroup({ scope, techniqueIds, group: target.group })

    studentsAssigned += summary.studentsAssigned
    linksAdded += summary.linksAdded
  }

  return { studentsAssigned, linksAdded }
}

/**
 * Asigna UNA técnica al expediente de un conjunto de alumnos concretos.
 * Devuelve el número de alumnos efectivamente asignados.
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
  const { studentsAssigned } = await assignTechniquesToStudentsByIds({ scope, techniqueIds: [techniqueId], studentIds })
  return studentsAssigned
}

/**
 * Asigna UNA técnica al expediente de los alumnos activos de un grupo.
 * Devuelve el número de alumnos efectivamente asignados.
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
  const { studentsAssigned } = await assignTechniquesToStudentGroup({ scope, techniqueIds: [techniqueId], group })
  return studentsAssigned
}
