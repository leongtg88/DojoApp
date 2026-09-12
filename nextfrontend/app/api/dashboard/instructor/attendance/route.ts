import { auth } from '@/auth'
import { db } from '@/lib/db'
import { hasRole } from '@/lib/auth/roles'
import { classHours, formatTime } from '@/lib/dashboard/balance'
import type { AttendanceStatus } from '@/lib/generated/prisma'
import { ClassEnrollmentStatus } from '@/lib/generated/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const attendanceUpdateSchema = z.object({
  classId: z.string().trim().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records: z.array(z.object({
    studentId: z.string().trim().min(1),
    present: z.boolean(),
    justified: z.boolean().optional(),
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

  const scheduledClass = await db.class.findFirst({
    where: { id: classId, instructorId: session.user.id, active: true },
    select: {
      id: true,
      name: true,
      startTime: true,
      endTime: true,
      branch: { select: { schoolId: true } },
    },
  })

  if (!scheduledClass) {
    return NextResponse.json({ error: 'No tienes acceso a esta clase' }, { status: 403 })
  }

  // El pase de lista puede incluir alumnos de la misma escuela aunque no estén
  // inscritos en este horario (asistencia "fuera de horario").
  const validStudents = await db.student.count({
    where: { id: { in: recordStudentIds }, schoolId: scheduledClass.branch.schoolId },
  })

  if (validStudents !== recordStudentIds.length) {
    return NextResponse.json({ error: 'El registro incluye alumnos que no pertenecen a esta escuela' }, { status: 400 })
  }

  const enrolled = await db.classEnrollment.findMany({
    where: { classId, status: ClassEnrollmentStatus.ACTIVE },
    select: { studentId: true },
  })
  const enrolledStudentIds = new Set(enrolled.map(({ studentId }) => studentId))

  const sessionDate = new Date(`${date}T00:00:00.000Z`)
  const dayAfter = new Date(sessionDate.getTime() + 86_400_000)
  const defaultHours = classHours({ startTime: formatTime(scheduledClass.startTime), endTime: formatTime(scheduledClass.endTime) })

  await db.$transaction(async (transaction) => {
    const classSession = await transaction.classSession.upsert({
      where: { classId_date: { classId, date: sessionDate } },
      update: {},
      create: { classId, date: sessionDate },
      select: { id: true },
    })

    await Promise.all(records.map(async (record) => {
      const isConfirmed = record.present
      const status: AttendanceStatus = isConfirmed ? 'CONFIRMED' : (record.justified ? 'JUSTIFIED' : 'REJECTED')

      // Si el pase de lista ya existe para este alumno en esta sesión, se actualiza.
      // Se conservan las horas del punch-in fusionado si ya venían de una marcación previa.
      const existing = await transaction.attendance.findFirst({
        where: { sessionId: classSession.id, studentId: record.studentId },
        select: { id: true, hoursTrained: true },
      })

      const updateData = {
        present: record.present,
        notes: record.notes,
        status,
        hoursTrained: isConfirmed ? (existing && existing.hoursTrained > 0 ? existing.hoursTrained : defaultHours) : 0,
        sessionType: 'class',
        classId,
        isOutOfSchedule: !enrolledStudentIds.has(record.studentId),
        confirmedById: session.user.id,
        confirmedAt: new Date(),
      }

      if (existing) {
        return transaction.attendance.update({ where: { id: existing.id }, data: updateData })
      }

      // Si el alumno hizo punch-in el mismo día (sessionId null), fusiona el registro
      // en el pase de lista para evitar el doble conteo (punch + clase).
      const punch = await transaction.attendance.findFirst({
        where: {
          studentId: record.studentId,
          sessionId: null,
          date: { gte: sessionDate, lt: dayAfter },
        },
        select: { id: true, hoursTrained: true, notes: true, classId: true, isOutOfSchedule: true },
      })

      if (punch) {
        await transaction.attendance.deleteMany({ where: { sessionId: classSession.id, studentId: record.studentId } })
        return transaction.attendance.update({
          where: { id: punch.id },
          data: {
            ...updateData,
            sessionId: classSession.id,
            notes: record.notes ?? punch.notes,
            hoursTrained: isConfirmed ? (punch.hoursTrained ?? defaultHours) : 0,
            classId: punch.classId ?? classId,
            isOutOfSchedule: punch.isOutOfSchedule ?? !enrolledStudentIds.has(record.studentId),
          },
        })
      }

      return transaction.attendance.create({
        data: {
          ...updateData,
          sessionId: classSession.id,
          studentId: record.studentId,
          date: sessionDate,
        },
      })
    }))
  })

  return NextResponse.json({ ok: true })
}