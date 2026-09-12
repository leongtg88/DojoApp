import { Prisma } from '@/lib/generated/prisma'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createClassSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).nullable().optional(),
  audience: z.enum(['ADULTS', 'CHILDREN', 'MIXED']).default('MIXED'),
  branchId: z.string().trim().min(1).optional(),
  instructorId: z.string().trim().min(1).nullable().optional(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
}) .refine((value) => value.startTime !== value.endTime, {
  message: 'La hora de inicio no puede ser igual a la de fin',
  path: ['endTime'],
})

function schoolBranchesFilter(scope: { isSuperAdmin: boolean; schoolId: string | null }): Prisma.ClassWhereInput {
  return scope.isSuperAdmin ? {} : { branch: { schoolId: scope.schoolId! } }
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

  const classes = await db.class.findMany({
    where: { ...schoolBranchesFilter(scope) },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    select: {
      id: true,
      name: true,
      description: true,
      audience: true,
      active: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      branchId: true,
      branch: { select: { name: true } },
      instructor: { select: { id: true, name: true } },
      _count: { select: { enrollments: { where: { status: 'ACTIVE' } } } },
    },
  })

  return NextResponse.json({ classes })
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
  const result = createClassSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: 'Datos del horario no válidos', details: result.error.flatten().fieldErrors }, { status: 400 })
  }

  const data = result.data

  if (!data.branchId && !scope.isSuperAdmin) {
    return NextResponse.json({ error: 'Se requiere la sucursal para crear el horario.' }, { status: 400 })
  }

  const branch = await db.branch.findFirst({
    where: { id: data.branchId, ...(scope.isSuperAdmin ? {} : { schoolId: scope.schoolId! }) },
    select: { id: true },
  })

  if (!branch) {
    return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 })
  }

  const createData: Prisma.ClassUncheckedCreateInput = {
    name: data.name,
    description: data.description ?? null,
    audience: data.audience,
    branchId: branch.id,
    instructorId: data.instructorId ?? null,
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
    endTime: data.endTime,
    active: true,
  }

  const scheduledClass = await db.class.create({ data: createData })

  return NextResponse.json({ success: true, class: scheduledClass }, { status: 201 })
}