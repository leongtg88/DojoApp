import { Prisma } from '@/lib/generated/prisma'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { formatTime } from '@/lib/dashboard/balance'
import { findInstructorScheduleConflict } from '@/lib/dashboard/class-schedule'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateClassSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  audience: z.enum(['ADULTS', 'CHILDREN', 'MIXED']).optional(),
  active: z.boolean().optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  instructorId: z.string().trim().min(1).nullable().optional(),
}) .refine((value) => !(value.startTime && value.endTime && value.startTime === value.endTime), {
  message: 'La hora de inicio no puede ser igual a la de fin',
  path: ['endTime'],
})

function classScopeFilter(scope: { isSuperAdmin: boolean; schoolId: string | null }): Prisma.ClassWhereInput {
  return scope.isSuperAdmin ? {} : { branch: { schoolId: scope.schoolId! } }
}

interface ClassRouteContext {
  params: Promise<{ classId: string }>
}

export async function PATCH(request: Request, { params }: ClassRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = updateClassSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos del horario no válidos' }, { status: 400 })
  }

  const { classId } = await params
  const existing = await db.class.findFirst({
    where: { id: classId, ...classScopeFilter(scope) },
    select: { id: true, active: true, dayOfWeek: true, startTime: true, endTime: true, instructorId: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Horario no encontrado' }, { status: 404 })
  }

  if (result.data.instructorId) {
    const instructor = await db.user.findFirst({
      where: {
        id: result.data.instructorId,
        roles: { has: 'INSTRUCTOR' },
        ...(scope.isSuperAdmin ? {} : { OR: [{ schoolId: scope.schoolId! }, { schoolId: null }] }),
      },
      select: { id: true },
    })

    if (!instructor) {
      return NextResponse.json({ error: 'El instructor seleccionado no pertenece a la escuela.' }, { status: 400 })
    }
  }

  const nextActive = result.data.active ?? existing.active
  const nextInstructor = result.data.instructorId !== undefined ? result.data.instructorId : existing.instructorId

  if (nextActive && nextInstructor) {
    const conflict = await findInstructorScheduleConflict({
      dayOfWeek: result.data.dayOfWeek ?? existing.dayOfWeek,
      startTime: result.data.startTime ?? formatTime(existing.startTime),
      endTime: result.data.endTime ?? formatTime(existing.endTime),
      instructorId: nextInstructor,
      excludeClassId: existing.id,
    })

    if (conflict) {
      return NextResponse.json(
        { error: `El instructor ya tiene la clase "${conflict.name}" de ${formatTime(conflict.startTime)} a ${formatTime(conflict.endTime)} ese día.` },
        { status: 409 },
      )
    }
  }

  const scheduledClass = await db.class.update({
    where: { id: existing.id },
    data: {
      ...result.data,
      ...(result.data.startTime ? { startTime: `1970-01-01T${result.data.startTime}:00.000Z` } : {}),
      ...(result.data.endTime ? { endTime: `1970-01-01T${result.data.endTime}:00.000Z` } : {}),
    },
    select: {
      id: true,
      name: true,
      description: true,
      audience: true,
      active: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      instructorId: true,
    },
  })

  return NextResponse.json({ success: true, class: scheduledClass })
}

export async function DELETE(_request: Request, { params }: ClassRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { classId } = await params
  const existing = await db.class.findFirst({
    where: { id: classId, ...classScopeFilter(scope) },
    include: { _count: { select: { sessions: true, attendances: true } } },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Horario no encontrado' }, { status: 404 })
  }

  if (existing._count.sessions > 0 || existing._count.attendances > 0) {
    await db.class.update({ where: { id: existing.id }, data: { active: false } })
    return NextResponse.json({ ok: true, deactivated: true, message: 'El horario tiene actividad registrada y se desactivó.' })
  }

  await db.$transaction([
    db.classEnrollment.deleteMany({ where: { classId: existing.id } }),
    db.class.delete({ where: { id: existing.id } }),
  ])

  return NextResponse.json({ ok: true, deactivated: false, classId: existing.id })
}