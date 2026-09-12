import { Prisma, ClassEnrollmentStatus } from '@/lib/generated/prisma'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const enrollSchema = z.object({
  studentIds: z.array(z.string().trim().min(1)).max(500),
})

function classScopeFilter(scope: { isSuperAdmin: boolean; schoolId: string | null }): Prisma.ClassWhereInput {
  return scope.isSuperAdmin ? {} : { branch: { schoolId: scope.schoolId! } }
}

interface EnrollRouteContext {
  params: Promise<{ classId: string }>
}

export async function POST(request: Request, { params }: EnrollRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = enrollSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de inscripción no válidos' }, { status: 400 })
  }

  const { classId } = await params
  const existing = await db.class.findFirst({
    where: { id: classId, ...classScopeFilter(scope) },
    select: { id: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Horario no encontrado' }, { status: 404 })
  }

  const studentIds = [...new Set(result.data.studentIds)]
  const studentsInSchool = await db.student.count({
    where: {
      id: { in: studentIds },
      ...(scope.isSuperAdmin ? {} : { schoolId: scope.schoolId! }),
      status: 'ACTIVE',
    },
  })

  if (studentsInSchool !== studentIds.length) {
    return NextResponse.json({ error: 'Algunos alumnos no existen o no están activos en esta escuela' }, { status: 400 })
  }

  await db.$transaction(
    studentIds.map((studentId) =>
      db.classEnrollment.upsert({
        where: { classId_studentId: { classId, studentId } },
        update: { status: 'ACTIVE', endedAt: null },
        create: { classId, studentId, status: 'ACTIVE' },
      }),
    ),
  )

  return NextResponse.json({ ok: true, enrolled: studentIds.length }, { status: 201 })
}

export async function DELETE(request: Request, { params }: EnrollRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = enrollSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de inscripción no válidos' }, { status: 400 })
  }

  const { classId } = await params
  const existing = await db.class.findFirst({
    where: { id: classId, ...classScopeFilter(scope) },
    select: { id: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Horario no encontrado' }, { status: 404 })
  }

  const studentIds = [...new Set(result.data.studentIds)]
  const now = new Date()

  await db.classEnrollment.updateMany({
    where: { classId, studentId: { in: studentIds }, status: ClassEnrollmentStatus.ACTIVE },
    data: { status: ClassEnrollmentStatus.ENDED, endedAt: now },
  })

  return NextResponse.json({ ok: true })
}