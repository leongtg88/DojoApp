import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { classHours, formatTime } from '@/lib/dashboard/balance'
import { ClassEnrollmentStatus } from '@/lib/generated/prisma'
import { saveClassAttendance } from '@/lib/dashboard/attendance-roster'
import { recordAudit } from '@/lib/security/audit'
import { isSameOrigin, sameOriginResponse } from '@/lib/security/origin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const passSchema = z.object({
  classId: z.string().trim().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records: z.array(z.object({
    studentId: z.string().trim().min(1),
    present: z.boolean(),
    notes: z.string().trim().max(500).nullable(),
  })).max(500),
})

/**
 * Permite al administrador completar/corregir el pase de lista de una clase/fecha
 * (por ejemplo, cuando el instructor olvidó registrarlo). Reutiliza la misma
 * lógica que el instructor y marca la sesión como auditada por el admin.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return sameOriginResponse()
  }

  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = passSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de asistencia no válidos' }, { status: 400 })
  }

  const { classId, date, records } = result.data
  const recordStudentIds = records.map(({ studentId }) => studentId)

  if (new Set(recordStudentIds).size !== recordStudentIds.length) {
    return NextResponse.json({ error: 'Hay alumnos repetidos en el registro' }, { status: 400 })
  }

  const scheduledClass = await db.class.findFirst({
    where: {
      id: classId,
      active: true,
      ...(scope.isSuperAdmin ? {} : { branch: { schoolId: scope.schoolId! } }),
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      branch: { select: { schoolId: true } },
    },
  })

  if (!scheduledClass) {
    return NextResponse.json({ error: 'La clase no existe o no pertenece a tu escuela' }, { status: 404 })
  }

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

  await recordAudit({
    actorId: session.user.id,
    schoolId: scheduledClass.branch.schoolId,
    action: 'attendance.admin_pass',
    targetType: 'Class',
    targetId: classId,
    detail: { date, records: records.length },
  })

  return NextResponse.json({ ok: true })
}
