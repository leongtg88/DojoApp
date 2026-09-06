import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const techniqueAssignmentSchema = z.object({
  studentId: z.string().trim().min(1),
  techniqueId: z.string().trim().min(1),
  notes: z.string().trim().max(1_000).nullable(),
})

const techniqueUpdateSchema = techniqueAssignmentSchema.extend({
  approved: z.boolean(),
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

  await db.studentTechnique.update({
    where: { id: currentTechnique.id },
    data: {
      approved: result.data.approved,
      approvedAt: result.data.approved ? new Date() : null,
      approvedBy: result.data.approved ? session.user.id : null,
      notes: result.data.notes,
    },
  })

  return NextResponse.json({ ok: true })
}