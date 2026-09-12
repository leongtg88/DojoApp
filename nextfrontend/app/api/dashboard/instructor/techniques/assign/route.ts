import { auth } from '@/auth'
import { db } from '@/lib/db'
import { hasRole } from '@/lib/auth/roles'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const assignTechniquesSchema = z.object({
  studentId: z.string().trim().min(1),
  techniqueIds: z.array(z.string().trim().min(1)).max(300),
})

export async function PUT(request: Request) {
  const session = await auth()

  if (!session?.user?.id || !hasRole(session?.user, 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = assignTechniquesSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de asignación no válidos' }, { status: 400 })
  }

  const instructor = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, branchId: true },
  })

  if (!instructor) {
    return NextResponse.json({ error: 'Perfil de instructor no encontrado' }, { status: 404 })
  }

  const student = await db.student.findFirst({
    where: {
      id: result.data.studentId,
      ...(instructor.schoolId ? { schoolId: instructor.schoolId } : {}),
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
        ...(instructor.schoolId ? { OR: [{ schoolId: instructor.schoolId }, { schoolId: null }] } : {}),
      },
    })

    if (available !== requestedIds.length) {
      return NextResponse.json({ error: 'Alguna técnica no está disponible para esta escuela' }, { status: 400 })
    }
  }

  const desired = new Set(requestedIds)

  const { added, removed } = await db.$transaction(async (transaction) => {
    const existing = await transaction.studentTechnique.findMany({
      where: { studentId: student.id, techniqueId: { in: requestedIds } },
      select: { id: true, techniqueId: true, approved: true, evaluation: { select: { id: true } } },
    })
    const existingByTechnique = new Map(existing.map((entry) => [entry.techniqueId, entry]))

    const toRemove = existing
      .filter((entry) => !desired.has(entry.techniqueId) && !entry.approved && entry.evaluation === null)
      .map((entry) => entry.id)

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

    return { added: addedCount, removed: toRemove.length }
  })

  return NextResponse.json({ ok: true, added, removed })
}