import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createPlanSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).nullable().optional(),
  monthlyHours: z.number().min(0).max(500).default(0),
  price: z.number().min(0).max(1_000_000).nullable().optional(),
  isUnlimited: z.boolean().default(false),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).optional(),
})

function planScopeFilter(scope: { isSuperAdmin: boolean; schoolId: string | null }) {
  return scope.isSuperAdmin ? {} : { schoolId: scope.schoolId }
}

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const plans = await db.plan.findMany({
    where: { ...planScopeFilter(scope) },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      name: true,
      description: true,
      monthlyHours: true,
      price: true,
      currency: true,
      isUnlimited: true,
      active: true,
      sortOrder: true,
      _count: { select: { students: true } },
    },
  })

  return NextResponse.json({
    plans: plans.map(({ _count, price, ...plan }) => ({
      ...plan,
      price: price?.toNumber() ?? null,
      studentCount: _count.students,
    })),
  })
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const result = createPlanSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: 'Datos del plan no válidos' }, { status: 400 })
  }

  const aggregate = await db.plan.aggregate({
    where: { ...planScopeFilter(scope) },
    _max: { sortOrder: true },
  })
  const sortOrder = result.data.sortOrder ?? (aggregate._max.sortOrder ?? 0) + 1

  const plan = await db.plan.create({
    data: {
      name: result.data.name,
      description: result.data.description ?? null,
      monthlyHours: result.data.monthlyHours,
      price: result.data.price ?? null,
      isUnlimited: result.data.isUnlimited,
      active: result.data.active,
      sortOrder,
      schoolId: scope.schoolId,
    },
  })

  return NextResponse.json({ plan: { ...plan, price: plan.price?.toNumber() ?? null } }, { status: 201 })
}