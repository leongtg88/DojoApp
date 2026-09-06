import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

const techniqueAssignmentSchema = z.object({
  studentId: z.string().trim().min(1),
  techniqueId: z.string().trim().min(1),
  notes: z.string().trim().max(1_000).nullable(),
})

const techniqueUpdateSchema = techniqueAssignmentSchema.extend({
  approved: z.boolean().optional(),
  inPractice: z.boolean().optional(),
  score: z.number().int().min(0).max(10).nullable().optional(),
  feedback: z.string().trim().max(2_000).nullable().optional(),
})

async function findInstructorStudent(userId: string, studentId: string) {
  return db.student.findFirst({
    where: {
      id: studentId,
      classEnrollments: {
        some: {
          status: 'ACTIVE',
          class: { instructorId: userId },
        },
      },
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

  if (session?.user?.role !== 'INSTRUCTOR' || !session.user.id) {
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

  if (session?.user?.role !== 'INSTRUCTOR' || !session.user.id) {
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

  const data: Prisma.StudentTechniqueUpdateInput = { notes: result.data.notes }

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

    if (result.data.score !== undefined && result.data.score !== null) {
      await transaction.techniqueEvaluation.upsert({
        where: { studentTechniqueId: currentTechnique.id },
        update: {
          score: result.data.score,
          feedback: result.data.feedback ?? result.data.notes,
          evaluatedBy: session.user.id,
          evaluatedAt: new Date(),
        },
        create: {
          studentTechniqueId: currentTechnique.id,
          score: result.data.score,
          feedback: result.data.feedback ?? result.data.notes,
          evaluatedBy: session.user.id,
        },
      })
    }
  })

  return NextResponse.json({ ok: true })
}