import { auth } from '@/auth'
import { db } from '@/lib/db'
import { hasRole } from '@/lib/auth/roles'
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

  if (!session?.user?.id || !hasRole(session?.user, 'INSTRUCTOR')) {
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
  const dayAfter = new Date(sessionDate.getTime() + 86_400_000)

  await db.$transaction(async (transaction) => {
    const classSession = await transaction.classSession.upsert({
      where: { classId_date: { classId, date: sessionDate } },
      update: {},
      create: { classId, date: sessionDate },
      select: { id: true },
    })

    await Promise.all(records.map(async (record) => {
      // Si el pase de lista ya existe para este alumno en esta sesión, se actualiza.
      // Se conservan las horas del punch-in fusionado si ya venían de una marcación previa.
      const existing = await transaction.attendance.findFirst({
        where: { sessionId: classSession.id, studentId: record.studentId },
        select: { id: true, hoursTrained: true },
      })

      if (existing) {
        const hadHours = (existing.hoursTrained ?? 0) > 0
        return transaction.attendance.update({
          where: { id: existing.id },
          data: {
            present: record.present,
            notes: record.notes,
            status: record.present ? 'CONFIRMED' : 'REJECTED',
            hoursTrained: record.present ? (hadHours ? existing.hoursTrained : 1) : 0,
            sessionType: 'class',
            confirmedById: session.user.id,
            confirmedAt: record.present ? new Date() : null,
          },
        })
      }

      // Si el alumno hizo punch-in el mismo día (sessionId null), fusiona el registro
      // en el pase de lista para evitar el doble conteo (punch + clase).
      const punch = await transaction.attendance.findFirst({
        where: {
          studentId: record.studentId,
          sessionId: null,
          date: { gte: sessionDate, lt: dayAfter },
        },
        select: { id: true, hoursTrained: true, notes: true },
      })

      if (punch) {
        await transaction.attendance.deleteMany({ where: { sessionId: classSession.id, studentId: record.studentId } })
        return transaction.attendance.update({
          where: { id: punch.id },
          data: {
            sessionId: classSession.id,
            present: record.present,
            notes: record.notes ?? punch.notes,
            status: record.present ? 'CONFIRMED' : 'REJECTED',
            hoursTrained: record.present ? (punch.hoursTrained ?? 1) : 0,
            confirmedById: session.user.id,
            confirmedAt: record.present ? new Date() : null,
          },
        })
      }

      return transaction.attendance.create({
        data: {
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
      })
    }))
  })

  return NextResponse.json({ ok: true })
}