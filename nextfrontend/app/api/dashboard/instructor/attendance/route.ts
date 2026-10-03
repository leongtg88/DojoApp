import { auth } from '@/auth'
import { db } from '@/lib/db'
import { hasRole } from '@/lib/auth/roles'
import { classHours, formatTime } from '@/lib/dashboard/balance'
import { ClassEnrollmentStatus } from '@/lib/generated/prisma'
import { saveClassAttendance } from '@/lib/dashboard/attendance-roster'
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

  const defaultHours = classHours({ startTime: formatTime(scheduledClass.startTime), endTime: formatTime(scheduledClass.endTime) })

  await saveClassAttendance({
    classId,
    date,
    records,
    confirmedById: session.user.id,
    defaultHours,
    enrolledStudentIds,
  })

  return NextResponse.json({ ok: true })
}