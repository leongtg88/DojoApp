import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope, scopeSchoolFilter } from '@/lib/dashboard/scope'
import { notifyAssignment } from '@/lib/notifications/create'
import { Prisma } from '@/lib/generated/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const kataEvaluationSchema = z
  .object({
    approved: z.boolean().optional(),
    score: z.number().int().min(0).max(10).nullable().optional(),
    feedback: z.string().trim().max(2_000).nullable().optional(),
  })
  .refine((value) => value.approved !== undefined || value.score !== undefined || value.feedback !== undefined, {
    message: 'Sin cambios',
  })

interface KataEvaluationRouteContext {
  params: Promise<{ studentId: string; techniqueId: string }>
}

export async function PATCH(request: Request, { params }: KataEvaluationRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = kataEvaluationSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de evaluación no válidos' }, { status: 400 })
  }

  const { studentId, techniqueId } = await params
  const student = await db.student.findFirst({
    where: { id: studentId, ...scopeSchoolFilter(scope) },
    select: { id: true },
  })

  if (!student) {
    return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
  }

  const currentTechnique = await db.studentTechnique.findUnique({
    where: { studentId_techniqueId: { studentId: student.id, techniqueId } },
    select: { id: true },
  })

  if (!currentTechnique) {
    return NextResponse.json({ error: 'La kata no está asignada al alumno' }, { status: 404 })
  }

  const data: Prisma.StudentTechniqueUncheckedUpdateInput = {}

  if (result.data.approved !== undefined) {
    data.approved = result.data.approved
    data.approvedAt = result.data.approved ? new Date() : null
    data.approvedBy = result.data.approved ? session.user.id : null
  }

  if (result.data.feedback !== undefined && result.data.approved === undefined && result.data.score === undefined) {
    data.notes = result.data.feedback
  }

  await db.$transaction(async (transaction) => {
    if (Object.keys(data).length > 0) {
      await transaction.studentTechnique.update({ where: { id: currentTechnique.id }, data })
    }

    if (result.data.score !== undefined && result.data.score !== null) {
      await transaction.techniqueEvaluation.upsert({
        where: { studentTechniqueId: currentTechnique.id },
        update: {
          score: result.data.score,
          feedback: result.data.feedback ?? null,
          evaluatedBy: session.user.id,
          evaluatedAt: new Date(),
        },
        create: {
          studentTechniqueId: currentTechnique.id,
          score: result.data.score,
          feedback: result.data.feedback ?? null,
          evaluatedBy: session.user.id,
        },
      })
    }
  })

  const technique = await db.technique.findUnique({
    where: { id: techniqueId },
    select: { name: true },
  })
  const techniqueName = technique?.name ?? 'la kata'

  if (result.data.approved === true) {
    await notifyAssignment({ type: 'TECHNIQUE_APPROVED', studentId: student.id, data: { techniqueName } })
  } else if (result.data.score !== undefined && result.data.score !== null) {
    await notifyAssignment({ type: 'TECHNIQUE_EVALUATED', studentId: student.id, data: { techniqueName, score: result.data.score } })
  }

  return NextResponse.json({ ok: true })
}
