import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { getCurrentAbsencePolicy, recordAbsencePolicyChange } from '@/lib/dashboard/absence-policy-settings'
import { recordAudit } from '@/lib/security/audit'
import { isSameOrigin, sameOriginResponse } from '@/lib/security/origin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const policySchema = z.object({
  policy: z.enum(['LOCK_AT_CLOSE', 'RESTORE_ON_RECOVERY']),
  schoolId: z.string().trim().min(1).max(100).optional(),
})

async function resolveSchoolId(
  scope: { isSuperAdmin: boolean; schoolId: string | null },
  requestedSchoolId: string | null,
): Promise<string | null> {
  if (!scope.isSuperAdmin) return scope.schoolId

  const schoolId = requestedSchoolId ?? scope.schoolId
  if (!schoolId) return null

  const school = await db.school.findUnique({ where: { id: schoolId }, select: { id: true } })
  return school?.id ?? null
}

export async function GET(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const requestedSchoolId = new URL(request.url).searchParams.get('schoolId')
  const schoolId = await resolveSchoolId(scope, requestedSchoolId)

  if (!schoolId) {
    return NextResponse.json({ error: 'Escuela no válida' }, { status: 400 })
  }

  return NextResponse.json({
    schoolId,
    policy: await getCurrentAbsencePolicy(schoolId),
  })
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return sameOriginResponse()
  }

  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = policySchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Política no válida' }, { status: 400 })
  }

  const schoolId = await resolveSchoolId(scope, result.data.schoolId ?? null)

  if (!schoolId) {
    return NextResponse.json({ error: 'Escuela no válida' }, { status: 400 })
  }

  const previous = await getCurrentAbsencePolicy(schoolId)

  if (previous === result.data.policy) {
    return NextResponse.json({ schoolId, policy: previous, unchanged: true })
  }

  const change = await recordAbsencePolicyChange({ schoolId, policy: result.data.policy })

  await recordAudit({
    actorId: session.user.id,
    schoolId,
    action: 'attendance.absence_policy_change',
    targetType: 'SchoolAbsencePolicy',
    targetId: change.id,
    detail: { policy: change.policy, previous },
  })

  return NextResponse.json({
    schoolId,
    policy: change.policy,
    effectiveFrom: change.effectiveFrom.toISOString(),
  })
}
