import { auth } from '@/auth'
import { db } from '@/lib/db'
import { hasRole } from '@/lib/auth/roles'
import { getInstructorSchoolId } from '@/lib/dashboard/instructor-queries'
import { averageKataCriteria, isCompleteKataCriteria, KATA_CRITERION_KEYS } from '@/lib/dashboard/kata-rubric'
import { notifyAssignment } from '@/lib/notifications/create'
import { NextResponse } from 'next/server'
import { Prisma } from '@/lib/generated/prisma'
import { z } from 'zod'

const techniqueAssignmentSchema = z.object({
  studentId: z.string().trim().min(1),
  techniqueId: z.string().trim().min(1),
  notes: z.string().trim().max(1_000).nullable().optional(),
})

const techniqueUpdateSchema = techniqueAssignmentSchema.extend({
  approved: z.boolean().optional(),
  inPractice: z.boolean().optional(),
  score: z.number().min(0).max(10).nullable().optional(),
  criteria: z.record(z.enum(KATA_CRITERION_KEYS), z.number().min(0).max(10)).nullable().optional(),
  feedback: z.string().trim().max(2_000).nullable().optional(),
})

async function findInstructorStudent(userId: string, studentId: string) {
  const schoolId = await getInstructorSchoolId(userId)

  if (!schoolId) {
    return null
  }

  return db.student.findFirst({
    where: {
      id: studentId,
      schoolId,
      status: 'ACTIVE',
    },
    select: { id: true, schoolId: true },
  })
}

async function findSchoolTechnique(techniqueId: string, schoolId: string) {
  return db.technique.findFirst({
    where: {
      id: techniqueId,
      OR: [{ schoolId }, { schoolId: null }],
    },
    select: { id: true },
  })
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id || !hasRole(session?.user, 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = techniqueAssignmentSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de técnica no válidos' }, { status: 400 })
  }

  const student = await findInstructorStudent(session.user.id, result.data.studentId)

  if (!student || !(await findSchoolTechnique(result.data.techniqueId, student.schoolId))) {
    return NextResponse.json({ error: 'No puedes asignar esta técnica' }, { status: 403 })
  }

  await db.studentTechnique.upsert({
    where: {
      studentId_techniqueId: {
        studentId: student.id,
        techniqueId: result.data.techniqueId,
      },
    },
    update: { notes: result.data.notes },
    create: {
      studentId: student.id,
      techniqueId: result.data.techniqueId,
      notes: result.data.notes,
    },
  })

  return NextResponse.json({ ok: true })
}

export async function PATCH(request: Request) {
  const session = await auth()

  if (!session?.user?.id || !hasRole(session?.user, 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = techniqueUpdateSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de evaluación no válidos' }, { status: 400 })
  }

  const student = await findInstructorStudent(session.user.id, result.data.studentId)

  if (!student) {
    return NextResponse.json({ error: 'No puedes evaluar a este alumno' }, { status: 403 })
  }

  const currentTechnique = await db.studentTechnique.findUnique({
    where: {
      studentId_techniqueId: {
        studentId: student.id,
        techniqueId: result.data.techniqueId,
      },
    },
    select: { id: true },
  })

  if (!currentTechnique) {
    return NextResponse.json({ error: 'La técnica no está asignada al alumno' }, { status: 404 })
  }

  const criteria = result.data.criteria ?? null

  if (criteria !== null && !isCompleteKataCriteria(criteria)) {
    return NextResponse.json({ error: 'Debes puntuar los 10 criterios de la kata (0-10)' }, { status: 400 })
  }

  const evaluationScore = criteria ? averageKataCriteria(criteria) : result.data.score

  const data: Prisma.StudentTechniqueUncheckedUpdateInput = { notes: result.data.notes }

  if (result.data.approved !== undefined) {
    data.approved = result.data.approved
    data.approvedAt = result.data.approved ? new Date() : null
    data.approvedBy = result.data.approved ? session.user.id : null
  }

  if (result.data.inPractice !== undefined) {
    data.inPractice = result.data.inPractice
  }

  await db.$transaction(async (transaction) => {
    await transaction.studentTechnique.update({
      where: { id: currentTechnique.id },
      data,
    })

    if (evaluationScore !== undefined && evaluationScore !== null) {
      const feedback = result.data.feedback ?? result.data.notes
      await transaction.techniqueEvaluation.upsert({
        where: { studentTechniqueId: currentTechnique.id },
        update: {
          score: evaluationScore,
          feedback,
          evaluatedBy: session.user.id,
          evaluatedAt: new Date(),
          ...(criteria ? { criteria } : {}),
        },
        create: {
          studentTechniqueId: currentTechnique.id,
          score: evaluationScore,
          feedback,
          evaluatedBy: session.user.id,
          ...(criteria ? { criteria } : {}),
        },
      })
    }
  })

  const technique = await db.technique.findUnique({
    where: { id: result.data.techniqueId },
    select: { name: true },
  })
  const techniqueName = technique?.name ?? 'la técnica'

  if (result.data.approved === true) {
    await notifyAssignment({
      type: 'TECHNIQUE_APPROVED',
      studentId: student.id,
      data: { techniqueName },
    })
  } else if (evaluationScore !== undefined && evaluationScore !== null) {
    await notifyAssignment({
      type: 'TECHNIQUE_EVALUATED',
      studentId: student.id,
      data: { techniqueName, score: evaluationScore },
    })
  }

  return NextResponse.json({ ok: true })
}