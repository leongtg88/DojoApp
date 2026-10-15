import 'server-only'
import { db } from '@/lib/db'

export interface LoginGateUser {
  id: string
  roles: string[]
}

/**
 * Regla de acceso al dashboard, compartida por el login con contraseña y el
 * login con huella:
 *
 * - El staff multirol y los tutores (GUARDIAN) nunca quedan bloqueados aquí.
 * - Un alumno cuyo único rol es STUDENT solo entra si su expediente proviene de
 *   una inscripción: relación `enrollments` (inscripción convertida) o
 *   `enrollmentApplicant` (aspirante familiar). Las cuentas sin expediente
 *   (auto-registradas u huérfanas) quedan bloqueadas: el acceso es exclusivo
 *   por invitación de la escuela.
 */
export async function userHasDashboardAccess(user: LoginGateUser): Promise<boolean> {
  const hasStaffOrGuardianRole = user.roles.some((role) => role !== 'STUDENT')
  if (hasStaffOrGuardianRole) {
    return true
  }

  const studentWithEnrollment = await db.student.findFirst({
    where: {
      userId: user.id,
      OR: [
        { enrollments: { some: {} } },
        { enrollmentApplicant: { isNot: null } },
      ],
    },
    select: { id: true },
  })

  return Boolean(studentWithEnrollment)
}
