import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const attendanceUpdateSchema = z.object({
  classId: z.string().trim().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records: z.array(z.object({
    studentId: z.string().trim().min(1),
    present: z.boolean(),
    notes: z.string().trim().max(500).nullable(),
  })).max(500),
})

export async function POST(request: Request) {
  const session = await auth()

  if (session?.user?.role !== 'INSTRUCTOR' || !session.user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const result = attendanceUpdateSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de asistencia no válidos' }, { status: 400 })
  }

  const { classId, date, records } = result.data
  const recordStudentIds = records.map(({ studentId }) => studentId)

  if (new Set(recordStudentIds).size !== recordStudentIds.length) {
    return NextResponse.json({ error: 'Hay alumnos repetidos en el registro' }, { status: 400 })
  }

  const assignedClass = await db.class.findFirst({
    where: { id: classId, instructorId: session.user.id },
    select: { id: true },
  })

  if (!assignedClass) {
    return NextResponse.json({ error: 'No tienes acceso a esta clase' }, { status: 403 })
  }

  const enrollments = await db.classEnrollment.findMany({
    where: { classId, status: 'ACTIVE' },
    select: { studentId: true },
  })
  const enrolledStudentIds = new Set(enrollments.map(({ studentId }) => studentId))

  if (recordStudentIds.some((studentId) => !enrolledStudentIds.has(studentId))) {
    return NextResponse.json({ error: 'El registro incluye alumnos no inscritos' }, { status: 400 })
  }

  const sessionDate = new Date(`${date}T00:00:00.000Z`)

  await db.$transaction(async (transaction) => {
    const classSession = await transaction.classSession.upsert({
      where: { classId_date: { classId, date: sessionDate } },
      update: {},
      create: { classId, date: sessionDate },
      select: { id: true },
    })

    await Promise.all(records.map((record) => transaction.attendance.upsert({
      where: {
        sessionId_studentId: {
          sessionId: classSession.id,
          studentId: record.studentId,
        },
      },
      update: {
        present: record.present,
        notes: record.notes,
        status: record.present ? 'CONFIRMED' : 'REJECTED',
        hoursTrained: record.present ? 1 : 0,
        sessionType: 'class',
        confirmedById: session.user.id,
        confirmedAt: record.present ? new Date() : null,
      },
      create: {
        sessionId: classSession.id,
        studentId: record.studentId,
        present: record.present,
        notes: record.notes,
        date: sessionDate,
        status: record.present ? 'CONFIRMED' : 'REJECTED',
        hoursTrained: record.present ? 1 : 0,
        sessionType: 'class',
        confirmedById: session.user.id,
        confirmedAt: record.present ? new Date() : null,
      },
    })))
  })

  return NextResponse.json({ ok: true })
}