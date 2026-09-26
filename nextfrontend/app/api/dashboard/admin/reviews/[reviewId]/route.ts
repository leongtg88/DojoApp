import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateReviewSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
})

interface ReviewRouteContext {
  params: Promise<{ reviewId: string }>
}

export async function PATCH(request: Request, { params }: ReviewRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = updateReviewSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Estado de reseña no válido' }, { status: 400 })
  }

  const { reviewId } = await params
  const existing = await db.review.findFirst({
    where: { id: reviewId, ...(scope.isSuperAdmin ? {} : { schoolId: scope.schoolId }) },
    select: { id: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Reseña no encontrada' }, { status: 404 })
  }

  const updated = await db.review.update({
    where: { id: existing.id },
    data: {
      status: result.data.status,
      approvedAt: result.data.status === 'APPROVED' ? new Date() : null,
    },
    select: { id: true, status: true, approvedAt: true },
  })

  return NextResponse.json({
    review: {
      id: updated.id,
      status: updated.status,
      approvedAt: updated.approvedAt?.toISOString() ?? null,
    },
  })
}

export async function DELETE(_request: Request, { params }: ReviewRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { reviewId } = await params
  const existing = await db.review.findFirst({
    where: { id: reviewId, ...(scope.isSuperAdmin ? {} : { schoolId: scope.schoolId }) },
    select: { id: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Reseña no encontrada' }, { status: 404 })
  }

  await db.review.delete({ where: { id: existing.id } })

  return NextResponse.json({ ok: true, reviewId: existing.id })
}
