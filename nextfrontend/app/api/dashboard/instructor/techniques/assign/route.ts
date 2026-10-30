import { auth } from '@/auth'
import { db } from '@/lib/db'
import { hasRole } from '@/lib/auth/roles'
import { getInstructorSchoolId } from '@/lib/dashboard/instructor-queries'
import { notifyAssignment } from '@/lib/notifications/create'
import { recordAudit } from '@/lib/security/audit'
import { isSameOrigin, sameOriginResponse } from '@/lib/security/origin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const assignTechniquesSchema = z.object({
  studentId: z.string().trim().min(1),
  techniqueIds: z.array(z.string().trim().min(1)).max(300),
})

export async function PUT(request: Request) {
  if (!isSameOrigin(request)) return sameOriginResponse()

  const session = await auth()

  if (!session?.user?.id || !hasRole(session?.user, 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = assignTechniquesSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de asignación no válidos' }, { status: 400 })
  }

  const schoolId = await getInstructorSchoolId(session.user.id)

  if (!schoolId) {
    return NextResponse.json({ error: 'No perteneces a ninguna escuela' }, { status: 403 })
  }

  const student = await db.student.findFirst({
    where: {
      id: result.data.studentId,
      schoolId,
      status: 'ACTIVE',
    },
    select: { id: true },
  })

  if (!student) {
    return NextResponse.json({ error: 'Alumno no encontrado en tu escuela' }, { status: 404 })
  }

  const requestedIds = [...new Set(result.data.techniqueIds)]

  if (requestedIds.length > 0) {
    const available = await db.technique.count({
      where: {
        id: { in: requestedIds },
        OR: [{ schoolId }, { schoolId: null }],
      },
    })

    if (available !== requestedIds.length) {
      return NextResponse.json({ error: 'Alguna técnica no está disponible para esta escuela' }, { status: 400 })
    }
  }

  const desired = new Set(requestedIds)

  const { added, removed, skipped } = await db.$transaction(async (transaction) => {
    const existing = await transaction.studentTechnique.findMany({
      where: { studentId: student.id },
      select: { id: true, techniqueId: true, approved: true, evaluation: { select: { id: true } } },
    })
    const existingByTechnique = new Map(existing.map((entry) => [entry.techniqueId, entry]))

    const unmarked = existing.filter((entry) => !desired.has(entry.techniqueId))
    const toRemove = unmarked.filter((entry) => !entry.approved && entry.evaluation === null).map((entry) => entry.id)
    const skipped = unmarked.length - toRemove.length

    if (toRemove.length > 0) {
      await transaction.studentTechnique.deleteMany({ where: { id: { in: toRemove } } })
    }

    const toAdd = requestedIds.filter((techniqueId) => !existingByTechnique.has(techniqueId))

    let addedCount = 0
    if (toAdd.length > 0) {
      const creation = await transaction.studentTechnique.createMany({
        data: toAdd.map((techniqueId) => ({ studentId: student.id, techniqueId })),
        skipDuplicates: true,
      })
      addedCount = creation.count
    }

    return { added: addedCount, removed: toRemove.length, skipped }
  })

  if (added > 0) {
    await notifyAssignment({ type: 'TECHNIQUES_ASSIGNED', studentId: student.id, count: added })
  }

  if (removed > 0) {
    await notifyAssignment({ type: 'TECHNIQUES_REMOVED', studentId: student.id, count: removed })
  }

  if (added > 0 || removed > 0) {
    await recordAudit({
      actorId: session.user.id,
      schoolId,
      action: 'techniques.assign',
      targetType: 'Student',
      targetId: student.id,
      detail: { added, removed, skipped },
    })
  }

  return NextResponse.json({ ok: true, added, removed, skipped })
}