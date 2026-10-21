import 'server-only'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import type { AbsencePolicyPoint } from '@/lib/dashboard/absence-policy'
import type { AbsencePostClosePolicy } from '@/types/dashboard'

export interface AbsencePolicyChangeInput {
  schoolId: string
  policy: AbsencePostClosePolicy
}

export interface AbsencePolicyAdminData {
  isSuperAdmin: boolean
  schools: { id: string; name: string }[]
  selectedSchoolId: string | null
  policy: AbsencePostClosePolicy
}

/** Historial completo de la escuela, ordenado de más antiguo a más reciente. */
export async function listAbsencePolicyPoints(schoolId: string): Promise<AbsencePolicyPoint[]> {
  const rows = await db.schoolAbsencePolicy.findMany({
    where: { schoolId },
    orderBy: { effectiveFrom: 'asc' },
    select: { policy: true, effectiveFrom: true },
  })

  return rows.map((row) => ({
    policy: row.policy as AbsencePostClosePolicy,
    effectiveFrom: row.effectiveFrom,
  }))
}

/** Política vigente ahora. Sin historial, el valor por defecto es LOCK_AT_CLOSE. */
export async function getCurrentAbsencePolicy(schoolId: string | null): Promise<AbsencePostClosePolicy> {
  if (!schoolId) return 'LOCK_AT_CLOSE'

  const latest = await db.schoolAbsencePolicy.findFirst({
    where: { schoolId },
    orderBy: { effectiveFrom: 'desc' },
    select: { policy: true },
  })

  return (latest?.policy as AbsencePostClosePolicy | undefined) ?? 'LOCK_AT_CLOSE'
}

/**
 * Registra un cambio de política. No actualiza filas anteriores: el cierre de
 * cada cuatrimestre resuelve la última política vigente antes de su fecha.
 */
export async function recordAbsencePolicyChange({
  schoolId,
  policy,
}: AbsencePolicyChangeInput): Promise<{ id: string; policy: AbsencePostClosePolicy; effectiveFrom: Date }> {
  const row = await db.schoolAbsencePolicy.create({
    data: { schoolId, policy, effectiveFrom: new Date() },
    select: { id: true, policy: true, effectiveFrom: true },
  })

  return {
    id: row.id,
    policy: row.policy as AbsencePostClosePolicy,
    effectiveFrom: row.effectiveFrom,
  }
}

/**
 * Datos para la tarjeta de administración. Un SCHOOL_ADMIN usa su escuela; un
 * SUPERADMIN puede elegir entre todas las escuelas.
 */
export async function getAbsencePolicyAdminData(userId: string): Promise<AbsencePolicyAdminData | null> {
  const scope = await getAdminScope(userId)

  if (!scope) return null

  if (scope.isSuperAdmin) {
    const schools = await db.school.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
    const selectedSchoolId = scope.schoolId ?? schools[0]?.id ?? null

    return {
      isSuperAdmin: true,
      schools,
      selectedSchoolId,
      policy: await getCurrentAbsencePolicy(selectedSchoolId),
    }
  }

  return {
    isSuperAdmin: false,
    schools: [],
    selectedSchoolId: scope.schoolId,
    policy: await getCurrentAbsencePolicy(scope.schoolId),
  }
}
