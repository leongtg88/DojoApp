import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope, scopeSchoolFilter } from '@/lib/dashboard/scope'
import { notifyAssignment } from '@/lib/notifications/create'
import { ClassEnrollmentStatus, StudentStatus } from '@/lib/generated/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const assignTechniquesSchema = z.object({
  techniqueIds: z.array(z.string().trim().min(1)).min(1).max(300),
  target: z.object({
    type: z.enum(['ALL', 'GRADE', 'BRANCH', 'CLASS']),
    value: z.string().trim().min(1).optional(),
  }),
})

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = assignTechniquesSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de asignación no válidos' }, { status: 400 })
  }

  const { techniqueIds } = result.data
  const targetType = result.data.target.type
  const targetValue = result.data.target.value ?? ''

  if (targetType !== 'ALL' && !targetValue) {
    return NextResponse.json({ error: 'Selecciona un destino válido' }, { status: 400 })
  }

  const requestedIds = [...new Set(techniqueIds)]

  const available = await db.technique.count({
    where: {
      id: { in: requestedIds },
      ...(scope.isSuperAdmin ? {} : { OR: [{ schoolId: scope.schoolId! }, { schoolId: null }] }),
    },
  })

  if (available !== requestedIds.length) {
    return NextResponse.json({ error: 'Alguna técnica no está disponible para esta escuela' }, { status: 400 })
  }

  const targetFilter =
    targetType === 'GRADE'
      ? { currentRank: targetValue }
      : targetType === 'BRANCH'
        ? { branch: { name: targetValue } }
        : targetType === 'CLASS'
          ? { classEnrollments: { some: { status: ClassEnrollmentStatus.ACTIVE, class: { name: targetValue } } } }
          : {}

  const students = await db.student.findMany({
    where: {
      ...scopeSchoolFilter(scope),
      status: StudentStatus.ACTIVE,
      ...targetFilter,
    },
    select: { id: true },
  })

  let studentsProcessed = 0
  let linksAdded = 0
  const assignments: { studentId: string; added: number }[] = []

  for (const student of students) {
    const creation = await db.studentTechnique.createMany({
      data: requestedIds.map((techniqueId) => ({ studentId: student.id, techniqueId })),
      skipDuplicates: true,
    })

    studentsProcessed += 1
    linksAdded += creation.count

    if (creation.count > 0) {
      assignments.push({ studentId: student.id, added: creation.count })
    }
  }

  await Promise.all(
    assignments.map((assignment) =>
      notifyAssignment({ type: 'TECHNIQUES_ASSIGNED', studentId: assignment.studentId, count: assignment.added }),
    ),
  )

  return NextResponse.json({ ok: true, studentsProcessed, linksAdded })
}
