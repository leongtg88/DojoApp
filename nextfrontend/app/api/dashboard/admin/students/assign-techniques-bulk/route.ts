import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { assignTechniquesToTargets } from '@/lib/dashboard/technique-assign'
import { recordAudit } from '@/lib/security/audit'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const assignBulkSchema = z.object({
  techniqueIds: z.array(z.string().trim().min(1)).min(1).max(300),
  rankId: z.string().trim().min(1).optional(),
  targets: z.array(
    z.union([
      z.object({ kind: z.literal('STUDENT'), studentIds: z.array(z.string().trim().min(1)).min(1).max(500) }),
      z.object({
        kind: z.literal('GROUP'),
        group: z.object({
          type: z.enum(['ALL', 'GRADE', 'BRANCH', 'CLASS']),
          value: z.string().trim().min(1).optional(),
        }),
      }),
    ]),
  ).min(1).max(50),
})

/**
 * Asigna el conjunto de katas de un grado (todas sus técnicas) al expediente de
 * uno o varios alumnos, o de un grupo (todos / por grado / por sucursal / por
 * clase) dentro del alcance del administrador. Sólo agrega; nunca quita.
 */
export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = assignBulkSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de asignación no válidos' }, { status: 400 })
  }

  const { techniqueIds, rankId, targets } = result.data
  const uniqueTechniqueIds = [...new Set(techniqueIds)]

  const available = await db.technique.count({
    where: {
      id: { in: uniqueTechniqueIds },
      ...(scope.isSuperAdmin ? {} : { OR: [{ schoolId: scope.schoolId! }, { schoolId: null }] }),
    },
  })

  if (available !== uniqueTechniqueIds.length) {
    return NextResponse.json({ error: 'Alguna técnica no está disponible para esta escuela' }, { status: 400 })
  }

  const { studentsAssigned, linksAdded } = await assignTechniquesToTargets({ scope, techniqueIds: uniqueTechniqueIds, targets })

  if (linksAdded > 0) {
    await recordAudit({
      actorId: session.user.id,
      schoolId: scope.schoolId,
      action: 'techniques.assign',
      targetType: 'BeltRank',
      targetId: rankId ?? null,
      detail: { source: 'admin.assign-grade', techniqueIds: uniqueTechniqueIds, studentsAssigned, linksAdded },
    })
  }

  return NextResponse.json({ ok: true, studentsAssigned, linksAdded })
}
