import { db } from '@/lib/db'

/**
 * Utilidades para cuentas de tutor/padre en inscripciones familiares.
 *
 * Modelo de datos: un tutor que además se inscribe es un `Student` con su propio
 * expediente (`rol: 'tutor'` en registrationData) y a la vez un `User` con rol
 * `GUARDIAN`. Los hijos (menores) quedan vinculados a ese usuario vía
 * `Student.guardianId` (tutor principal) y `GuardianStudent` (m:m, permite
 * varios tutores). Durante la conversión de la inscripción se guarda en cada
 * hijo la metadata `registrationData.guardian.email`, que es lo que permite
 * enlazarlos de forma idempotente cuando el tutor acepta su invitación.
 */

export interface GuardianMetadata {
  /** Datos del tutor que se guardan en el expediente del hijo al convertirlo. */
  guardian?: {
    email: string
    name?: string
    relationship?: string
  }
  /** Rol del aspirante dentro de la inscripción familiar. */
  rol?: 'tutor' | 'alumno'
}

export function readGuardianMetadata(registrationData: unknown): GuardianMetadata {
  if (!registrationData || typeof registrationData !== 'object') {
    return { rol: 'alumno' }
  }
  const data = registrationData as Record<string, unknown>
  const guardian =
    data.guardian && typeof data.guardian === 'object' && !Array.isArray(data.guardian)
      ? (data.guardian as GuardianMetadata['guardian'])
      : undefined
  return {
    guardian,
    rol: data.rol === 'tutor' ? 'tutor' : 'alumno',
  }
}

/**
 * Vincula (idempotente) a un usuario tutor con los expedientes de sus hijos.
 * Los hijos se identifican por la metadata `guardian.email` guardada durante la
 * conversión de la inscripción familiar. Crea las filas `GuardianStudent` y
 * fija `Student.guardianId`. Devuelve la cantidad de vínculos creados.
 */
export async function linkGuardianToChildren(params: {
  userId: string
  schoolId: string
  guardianEmail?: string | null
  relationship?: string | null
}): Promise<number> {
  const { userId, schoolId } = params
  const guardianEmail = (params.guardianEmail ?? '').trim().toLowerCase()
  const relationship = params.relationship?.trim() || 'Tutor legal'

  if (!guardianEmail) return 0

  const candidates = await db.student.findMany({
    where: {
      schoolId,
      guardianId: { not: userId },
    },
    select: { id: true, registrationData: true },
  })

  const children = candidates.flatMap((child) => {
    const meta = readGuardianMetadata(child.registrationData)
    if (meta.guardian?.email?.trim().toLowerCase() !== guardianEmail) return []
    return [{ id: child.id, relationship: meta.guardian.relationship?.trim() || relationship }]
  })

  if (children.length === 0) return 0

  await db.$transaction(async (transaction) => {
    for (const child of children) {
      await transaction.guardianStudent.upsert({
        where: { guardianId_studentId: { guardianId: userId, studentId: child.id } },
        create: { guardianId: userId, studentId: child.id, relationship: child.relationship },
        update: { relationship: child.relationship },
      })
      // Solo se fija el tutor principal si el hijo aún no tiene uno, para no
      // reemplazar el guardián primario de otro tutor.
      await transaction.student.updateMany({
        where: { id: child.id, guardianId: null },
        data: { guardianId: userId },
      })
    }
  })

  return children.length
}

export interface FamilyMember {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
}

export interface FamilyView {
  /** Expediente propio del usuario (si es alumno). */
  self: FamilyMember | null
  /** Hijos de los que el usuario es tutor. */
  children: FamilyMember[]
}

/**
 * Devuelve los miembros de la familia accesibles desde una cuenta: el propio
 * expediente del usuario (si existe) y los hijos de los que es tutor.
 */
export async function getFamilyMembers(userId: string): Promise<FamilyView> {
  const [own, guardianRows, primaryGuardians] = await Promise.all([
    db.student.findFirst({
      where: { userId },
      select: { id: true, firstName: true, lastName: true, dateOfBirth: true },
    }),
    db.guardianStudent.findMany({
      where: { guardianId: userId },
      select: {
        student: { select: { id: true, firstName: true, lastName: true, dateOfBirth: true } },
      },
    }),
    db.student.findMany({
      where: { guardianId: userId },
      select: { id: true, firstName: true, lastName: true, dateOfBirth: true },
    }),
  ])

  const mapMember = (student: { id: string; firstName: string; lastName: string; dateOfBirth: Date }): FamilyMember => ({
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    dateOfBirth: student.dateOfBirth.toISOString(),
  })

  const children = new Map<string, FamilyMember>()
  for (const row of guardianRows) {
    if (row.student.id !== own?.id) children.set(row.student.id, mapMember(row.student))
  }
  for (const student of primaryGuardians) {
    if (student.id !== own?.id) children.set(student.id, mapMember(student))
  }

  return {
    self: own ? mapMember(own) : null,
    children: [...children.values()],
  }
}

/**
 * Resuelve qué expediente de alumno puede ver el usuario. Si no se solicita uno
 * explícito, usa su propio expediente; si se solicita, solo lo permite si es su
 * propio expediente o el de uno de sus hijos. Devuelve null si no hay
 * expediente permitido.
 */
export async function resolveStudentView(
  userId: string,
  requestedStudentId?: string | null,
): Promise<{ studentId: string } | null> {
  const family = await getFamilyMembers(userId)
  const ownId = family.self?.id ?? null

  if (!requestedStudentId || requestedStudentId === ownId) {
    if (ownId) return { studentId: ownId }
    // Cuenta de tutor sin expediente propio: por defecto la cuenta del primer hijo.
    return family.children.length > 0 ? { studentId: family.children[0].id } : null
  }

  const isChild = family.children.some((child) => child.id === requestedStudentId)
  return isChild ? { studentId: requestedStudentId } : null
}

/**
 * Resuelve el expediente activo para una request de la API del estudiante.
 * Lee el identificador del estudiante desde el header `X-Student-Id` o el query
 * param `estudiante`; si no se envía, usa el expediente propio del usuario.
 */
export async function resolveRequestStudent(
  request: Request,
  userId: string,
): Promise<{ studentId: string } | null> {
  const requested = request.headers.get('x-student-id') || new URL(request.url).searchParams.get('estudiante')
  return resolveStudentView(userId, requested)
}