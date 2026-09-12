import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updatePlanSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  monthlyHours: z.number().min(0).max(500).optional(),
  price: z.number().min(0).max(1_000_000).nullable().optional(),
  isUnlimited: z.boolean().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

interface PlanRouteContext {
  params: Promise<{ planId: string }>
}

export async function PATCH(request: Request, { params }: PlanRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = updatePlanSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos del plan no válidos' }, { status: 400 })
  }

  const { planId } = await params
  const existing = await db.plan.findFirst({
    where: { id: planId, ...(scope.isSuperAdmin ? {} : { schoolId: scope.schoolId }) },
    select: { id: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
  }

  const updated = await db.plan.update({
    where: { id: existing.id },
    data: result.data,
    select: {
      id: true,
      name: true,
      description: true,
      monthlyHours: true,
      price: true,
      isUnlimited: true,
      active: true,
      sortOrder: true,
    },
  })

  return NextResponse.json({ plan: updated })
}

export async function DELETE(_request: Request, { params }: PlanRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { planId } = await params
  const existing = await db.plan.findFirst({
    where: { id: planId, ...(scope.isSuperAdmin ? {} : { schoolId: scope.schoolId }) },
    include: { _count: { select: { students: true } } },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
  }

  if (existing._count.students > 0) {
    return NextResponse.json({ error: 'El plan tiene alumnos asignados; desactívalo en lugar de eliminarlo.' }, { status: 409 })
  }

  await db.plan.delete({ where: { id: existing.id } })

  return NextResponse.json({ ok: true, planId: existing.id })
}