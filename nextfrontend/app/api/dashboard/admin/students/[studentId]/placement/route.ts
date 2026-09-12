import { ClassEnrollmentStatus } from '@/lib/generated/prisma'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope, scopeSchoolFilter } from '@/lib/dashboard/scope'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const placementSchema = z.object({
  planId: z.string().trim().min(1).nullable(),
  scheduleIds: z.array(z.string().trim().min(1)).max(30),
  scholarshipType: z.enum(['NONE', 'ECONOMIC', 'MERIT', 'COMPETITOR']),
  scholarshipNote: z.string().trim().max(500).nullable().optional(),
  isCompetitor: z.boolean(),
  planStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
})

interface PlacementRouteContext {
  params: Promise<{ studentId: string }>
}

export async function PUT(request: Request, { params }: PlacementRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = placementSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de asignación no válidos' }, { status: 400 })
  }

  const { studentId } = await params
  const student = await db.student.findFirst({
    where: { id: studentId, ...scopeSchoolFilter(scope) },
    select: { id: true, planId: true },
  })

  if (!student) {
    return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
  }

  const data = result.data

  if (data.planId) {
    const plan = await db.plan.findFirst({
      where: {
        id: data.planId,
        ...(scope.isSuperAdmin ? {} : { OR: [{ schoolId: scope.schoolId }, { schoolId: null }] }),
      },
      select: { id: true },
    })

    if (!plan) {
      return NextResponse.json({ error: 'El plan no pertenece a esta escuela' }, { status: 400 })
    }
  }

  if (data.scheduleIds.length > 0) {
    const availableSchedules = await db.class.count({
      where: {
        id: { in: data.scheduleIds },
        active: true,
        ...(scope.isSuperAdmin ? {} : { branch: { schoolId: scope.schoolId! } }),
      },
    })

    if (availableSchedules !== data.scheduleIds.length) {
      return NextResponse.json({ error: 'Algunos horarios no existen o no están activos' }, { status: 400 })
    }
  }

  const planChanged = student.planId !== data.planId
  const planStartDate = data.planStartDate
    ? new Date(`${data.planStartDate}T00:00:00.000Z`)
    : planChanged
      ? new Date()
      : undefined

  await db.$transaction(async (transaction) => {
    await transaction.student.update({
      where: { id: student.id },
      data: {
        planId: data.planId,
        ...(planStartDate ? { planStartDate } : {}),
        scholarshipType: data.scholarshipType,
        scholarshipNote: data.scholarshipNote ?? null,
        isCompetitor: data.isCompetitor,
      },
    })

    const existing = await transaction.classEnrollment.findMany({
      where: { studentId: student.id, status: ClassEnrollmentStatus.ACTIVE },
      select: { classId: true },
    })
    const existingIds = new Set(existing.map((entry) => entry.classId))
    const desiredIds = new Set(data.scheduleIds)
    const now = new Date()

    const toAdd = [...desiredIds].filter((classId) => !existingIds.has(classId))
    const toRemove = [...existingIds].filter((classId) => !desiredIds.has(classId))

    if (toAdd.length > 0) {
      await transaction.classEnrollment.createMany({
        data: toAdd.map((classId) => ({ classId, studentId: student.id, status: ClassEnrollmentStatus.ACTIVE })),
        skipDuplicates: true,
      })
    }

    if (toRemove.length > 0) {
      await transaction.classEnrollment.updateMany({
        where: { studentId: student.id, classId: { in: toRemove }, status: ClassEnrollmentStatus.ACTIVE },
        data: { status: ClassEnrollmentStatus.ENDED, endedAt: now },
      })
    }
  })

  return NextResponse.json({ ok: true, studentId: student.id })
}