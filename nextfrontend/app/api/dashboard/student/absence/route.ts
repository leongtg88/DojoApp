import { auth } from '@/auth'
import { db } from '@/lib/db'
import { hasAnyRole } from '@/lib/auth/roles'
import { resolveRequestStudent } from '@/lib/family/guardians'
import { createAbsenceJustification, deleteAbsenceJustification } from '@/lib/dashboard/absence-justifications'
import { notifySchoolStaff } from '@/lib/notifications/create'
import { ATTENDANCE_LIMITS } from '@/lib/dashboard/attendance-limits'
import { consumeRateLimit, rateLimitResponse } from '@/lib/security/rate-limit'
import { recordAudit } from '@/lib/security/audit'
import { isSameOrigin, sameOriginResponse } from '@/lib/security/origin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const absenceSchema = z.object({
  classId: z.string().trim().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().trim().min(5).max(500),
})

const ERRORS: Record<string, { message: string; status: number }> = {
  INVALID_DATE: { message: 'Fecha no válida', status: 400 },
  FUTURE_DATE: { message: 'No puedes reportar una falta de una fecha futura.', status: 400 },
  OUT_OF_WINDOW: { message: 'Solo puedes reportar faltas de los últimos 30 días.', status: 400 },
  CLASS_NOT_ENROLLED: { message: 'Ese horario no pertenece a tus clases activas.', status: 403 },
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return sameOriginResponse()
  }

  const session = await auth()

  if (!session?.user?.id || !hasAnyRole(session?.user, ['STUDENT', 'GUARDIAN'])) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = absenceSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos del reporte no válidos' }, { status: 400 })
  }

  const view = await resolveRequestStudent(request, session.user.id)
  if (!view) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const attempt = await consumeRateLimit(`absence-report:student:${view.studentId}`, {
    limit: ATTENDANCE_LIMITS.maxEditsPerHourStudent,
    windowMs: 60 * 60 * 1000,
  })
  if (!attempt.allowed) {
    return rateLimitResponse(attempt.retryAfterSeconds, 'Has enviado varios reportes en poco tiempo. Inténtalo más tarde.')
  }

  const student = await db.student.findUnique({
    where: { id: view.studentId },
    select: { id: true, schoolId: true },
  })

  if (!student) {
    return NextResponse.json({ error: 'Perfil de estudiante no encontrado' }, { status: 404 })
  }

  try {
    const justification = await createAbsenceJustification({
      studentId: student.id,
      classId: result.data.classId,
      date: result.data.date,
      reason: result.data.reason,
    })

    await notifySchoolStaff({
      type: 'ATTENDANCE_ABSENCE_REPORTED',
      studentId: student.id,
      data: { className: justification.className },
    })

    await recordAudit({
      actorId: session.user.id,
      schoolId: student.schoolId,
      action: 'attendance.absence_report',
      targetType: 'AbsenceJustification',
      targetId: justification.id,
      detail: { studentId: student.id, classId: justification.classId, date: justification.date },
    })

    return NextResponse.json({ justification }, { status: 201 })
  } catch (error) {
    const mapped = error instanceof Error ? ERRORS[error.message] : undefined
    if (mapped) {
      return NextResponse.json({ error: mapped.message }, { status: mapped.status })
    }
    console.error('Error registrando reporte de inasistencia:', error)
    return NextResponse.json({ error: 'No fue posible registrar la falta' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return sameOriginResponse()
  }

  const session = await auth()

  if (!session?.user?.id || !hasAnyRole(session?.user, ['STUDENT', 'GUARDIAN'])) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const view = await resolveRequestStudent(request, session.user.id)
  if (!view) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const justificationId = new URL(request.url).searchParams.get('id')
  if (!justificationId) {
    return NextResponse.json({ error: 'Reporte no especificado' }, { status: 400 })
  }

  const removed = await deleteAbsenceJustification(view.studentId, justificationId)

  if (!removed) {
    return NextResponse.json({ error: 'El reporte no existe o ya fue revisado' }, { status: 409 })
  }

  return NextResponse.json({ ok: true })
}
