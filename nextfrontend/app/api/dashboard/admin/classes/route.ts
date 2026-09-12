import { Prisma } from '@/lib/generated/prisma'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { formatTime } from '@/lib/dashboard/balance'
import { findInstructorScheduleConflict } from '@/lib/dashboard/class-schedule'
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

  return NextResponse.json({
    classes: classes.map(({ branch, instructor, _count, startTime, endTime, ...scheduledClass }) => ({
      ...scheduledClass,
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
      branchName: branch.name,
      instructorId: instructor?.id ?? null,
      instructorName: instructor?.name ?? null,
      activeStudentCount: _count.enrollments,
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
  const result = createClassSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: 'Datos del horario no válidos', details: result.error.flatten().fieldErrors }, { status: 400 })
  }

  const data = result.data

  // Sede: la indicada, la del admin, o la primera disponible.
  let branchId = data.branchId ?? scope.branchId ?? null
  if (!branchId) {
    const fallbackBranch = await db.branch.findFirst({
      where: scope.isSuperAdmin ? {} : { schoolId: scope.schoolId! },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })
    branchId = fallbackBranch?.id ?? null
  }

  if (!branchId) {
    return NextResponse.json({ error: 'No se encontró una sede para el horario.' }, { status: 400 })
  }

  const branch = await db.branch.findFirst({
    where: { id: branchId, ...(scope.isSuperAdmin ? {} : { schoolId: scope.schoolId! }) },
    select: { id: true },
  })

  if (!branch) {
    return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 })
  }

  if (data.instructorId) {
    const instructor = await db.user.findFirst({
      where: {
        id: data.instructorId,
        roles: { has: 'INSTRUCTOR' },
        ...(scope.isSuperAdmin ? {} : { OR: [{ schoolId: scope.schoolId! }, { schoolId: null }] }),
      },
      select: { id: true },
    })

    if (!instructor) {
      return NextResponse.json({ error: 'El instructor seleccionado no pertenece a la escuela.' }, { status: 400 })
    }

    const conflict = await findInstructorScheduleConflict({
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      instructorId: data.instructorId,
    })

    if (conflict) {
      return NextResponse.json(
        { error: `El instructor ya tiene la clase "${conflict.name}" de ${formatTime(conflict.startTime)} a ${formatTime(conflict.endTime)} ese día.` },
        { status: 409 },
      )
    }
  }

  const createData: Prisma.ClassUncheckedCreateInput = {
    name: data.name,
    description: data.description ?? null,
    audience: data.audience,
    branchId: branch.id,
    instructorId: data.instructorId ?? null,
    dayOfWeek: data.dayOfWeek,
    startTime: `1970-01-01T${data.startTime}:00.000Z`,
    endTime: `1970-01-01T${data.endTime}:00.000Z`,
    active: true,
  }

  const scheduledClass = await db.class.create({ data: createData })

  return NextResponse.json({ success: true, class: scheduledClass }, { status: 201 })
}