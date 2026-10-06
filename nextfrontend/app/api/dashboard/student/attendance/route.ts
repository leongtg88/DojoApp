import { auth } from '@/auth'
import { db } from '@/lib/db'
import { hasAnyRole } from '@/lib/auth/roles'
import { resolveRequestStudent } from '@/lib/family/guardians'
import { resolveClassByTime, classHours, formatTime } from '@/lib/dashboard/balance'
import { registerPracticeLogs } from '@/lib/dashboard/technique-reps'
import { notifySchoolStaff } from '@/lib/notifications/create'
import { sendPushToSchoolAdmins } from '@/lib/push/web-push'
import { notifyAttendancePunchByTelegram } from '@/lib/integrations/telegram'
import { notifyAttendancePunchByWhatsApp } from '@/lib/integrations/whatsapp'
import { ATTENDANCE_LIMITS, getLocalDayBounds } from '@/lib/dashboard/attendance-limits'
import { consumeRateLimit, getClientIp, rateLimitResponse } from '@/lib/security/rate-limit'
import { recordAudit } from '@/lib/security/audit'
import { isSameOrigin, sameOriginResponse } from '@/lib/security/origin'
import type { PracticePlace } from '@/lib/generated/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const practiceLineSchema = z.object({
  techniqueId: z.string().trim().min(1).max(100),
  repetitions: z.number().int().min(1).max(100_000),
  place: z.enum(['DOJO', 'FUERA']).optional(),
  notes: z.string().trim().max(500).nullable().optional(),
})

const punchInSchema = z.object({
  hoursTrained: z.number().min(0.01).max(12).optional(),
  sessionType: z.string().trim().min(1).max(50).optional(),
  date: z.string().refine((value) => !Number.isNaN(new Date(value).getTime()), { message: 'Fecha de práctica inválida' }).optional(),
  notes: z.string().trim().max(500).optional().nullable(),
  practiceLogs: z.array(practiceLineSchema).max(30).optional(),
})

const SESSION_TYPES = ['class', 'private', 'autonomous', 'seminar', 'other'] as const

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return sameOriginResponse()
  }

  const session = await auth()

  if (!session?.user?.id || !hasAnyRole(session?.user, ['STUDENT', 'GUARDIAN'])) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const ipAttempt = await consumeRateLimit(`attendance-punch:ip:${getClientIp(request.headers)}`, {
    limit: ATTENDANCE_LIMITS.maxPunchesPerHourIp,
    windowMs: 60 * 60 * 1000,
  })
  if (!ipAttempt.allowed) {
    return rateLimitResponse(
      ipAttempt.retryAfterSeconds,
      'Demasiados registros desde esta conexión. Inténtalo de nuevo más tarde.',
    )
  }

  const body = await request.json().catch(() => null)
  const result = punchInSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de punch-in no válidos' }, { status: 400 })
  }

  const view = await resolveRequestStudent(request, session.user.id)
  if (!view) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const studentAttempt = await consumeRateLimit(`attendance-punch:student:${view.studentId}`, {
    limit: ATTENDANCE_LIMITS.maxPunchesPerHourStudent,
    windowMs: 60 * 60 * 1000,
  })
  if (!studentAttempt.allowed) {
    return rateLimitResponse(
      studentAttempt.retryAfterSeconds,
      'Has registrado varias prácticas en poco tiempo. Espera unos minutos e inténtalo de nuevo.',
    )
  }

  const student = await db.student.findUnique({
    where: { id: view.studentId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      branchId: true,
      schoolId: true,
      classEnrollments: { where: { status: 'ACTIVE' }, select: { classId: true } },
    },
  })

  if (!student) {
    return NextResponse.json({ error: 'Perfil de estudiante no encontrado' }, { status: 404 })
  }

  const now = new Date()
  // Fecha/hora de la práctica: por defecto ahora. Permite registrar "a
  // destiempo" (p. ej. olvidó marcar) dentro de los últimos 7 días.
  const punchDate = result.data.date ? new Date(result.data.date) : now

  if (Number.isNaN(punchDate.getTime())) {
    return NextResponse.json({ error: 'Fecha de práctica no válida' }, { status: 400 })
  }
  if (punchDate.getTime() > now.getTime()) {
    return NextResponse.json({ error: 'No puedes registrar práctica en el futuro.' }, { status: 400 })
  }
  const minAllowed = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
  if (punchDate.getTime() < minAllowed.getTime()) {
    return NextResponse.json({ error: 'Solo puedes registrar práctica de los últimos 7 días.' }, { status: 400 })
  }

  // Se permiten varias prácticas el mismo día (p. ej. clase + entrenamiento
  // libre). Solo se bloquea un duplicado exacto: misma fecha y hora.
  const duplicate = await db.attendance.findFirst({
    where: {
      studentId: student.id,
      sessionId: null,
      date: punchDate,
    },
    select: { id: true },
  })

  if (duplicate) {
    return NextResponse.json({ error: 'Ya registraste una práctica a esa misma hora. Puedes editarla mientras esté pendiente.' }, { status: 409 })
  }

  const sessionType = result.data.sessionType ?? 'class'

  if (!SESSION_TYPES.includes(sessionType as (typeof SESSION_TYPES)[number])) {
    return NextResponse.json({ error: 'Tipo de sesión no válido' }, { status: 400 })
  }

  // Detecta el horario activo correspondiente a la fecha/hora de la práctica para
  // marcar "fuera de horario" cuando no coincide con los horarios de referencia del alumno.
  const scheduledClasses = await db.class.findMany({
    where: { branchId: student.branchId, active: true },
    select: {
      id: true,
      name: true,
      audience: true,
      active: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
    },
  })
  const resolvedClass = resolveClassByTime(
    scheduledClasses.map(({ startTime, endTime, ...cls }) => ({ ...cls, startTime: formatTime(startTime), endTime: formatTime(endTime) })),
    punchDate,
  )
  const referenceIds = new Set(student.classEnrollments.map((entry) => entry.classId))

  // Una "clase regular" solo puede registrarse si hay un horario real a esa
  // fecha/hora (evita auto-asignarse una clase en días sin clase). Las horas se
  // derivan de la duración del horario, no del valor que envíe el cliente.
  if (sessionType === 'class' && !resolvedClass) {
    return NextResponse.json(
      { error: 'No hay una clase programada a esa hora. Selecciona otro tipo de entrenamiento.' },
      { status: 400 },
    )
  }

  const effectiveHours =
    sessionType === 'class' && resolvedClass
      ? classHours(resolvedClass)
      : (result.data.hoursTrained ?? (resolvedClass ? classHours(resolvedClass) : 1))
  const dailyReps = (result.data.practiceLogs ?? []).reduce((total, line) => total + line.repetitions, 0)

  // Topes anti-abuso del auto-reporte (no aplican a pases de lista con sessionId).
  const dayBounds = getLocalDayBounds(punchDate)
  const [selfReportedToday, lastPunch, dailyRepsAggregate] = await Promise.all([
    db.attendance.findMany({
      where: { studentId: student.id, sessionId: null, date: { gte: dayBounds.start, lt: dayBounds.end } },
      select: { hoursTrained: true },
    }),
    db.attendance.findFirst({
      where: { studentId: student.id, sessionId: null, date: { lt: punchDate } },
      orderBy: { date: 'desc' },
      select: { date: true },
    }),
    db.techniquePracticeLog.aggregate({
      where: { studentId: student.id, date: { gte: dayBounds.start, lt: dayBounds.end } },
      _sum: { repetitions: true },
    }),
  ])

  if (selfReportedToday.length >= ATTENDANCE_LIMITS.maxSelfReportedPerDay) {
    return NextResponse.json(
      { error: `Ya registraste el máximo de ${ATTENDANCE_LIMITS.maxSelfReportedPerDay} prácticas para este día. Tu Sensei revisará lo pendiente.` },
      { status: 429 },
    )
  }

  const hoursToday = selfReportedToday.reduce((total, record) => total + record.hoursTrained, 0)
  if (hoursToday + effectiveHours > ATTENDANCE_LIMITS.maxHoursPerDay) {
    return NextResponse.json(
      { error: `No puedes registrar más de ${ATTENDANCE_LIMITS.maxHoursPerDay} horas de práctica al día.` },
      { status: 429 },
    )
  }

  if (lastPunch) {
    const minutesSinceLast = (punchDate.getTime() - lastPunch.date.getTime()) / 60_000
    if (minutesSinceLast >= 0 && minutesSinceLast < ATTENDANCE_LIMITS.minMinutesBetweenPunches) {
      return NextResponse.json(
        { error: `Espera al menos ${ATTENDANCE_LIMITS.minMinutesBetweenPunches} minutos entre registros de práctica.` },
        { status: 429 },
      )
    }
  }

  const repsToday = dailyRepsAggregate._sum.repetitions ?? 0
  if (repsToday + dailyReps > ATTENDANCE_LIMITS.maxDailySelfReportedReps) {
    return NextResponse.json(
      { error: `Superaste el máximo de ${ATTENDANCE_LIMITS.maxDailySelfReportedReps} repeticiones auto-reportadas por día.` },
      { status: 429 },
    )
  }

  const attendance = await db.attendance.create({
    data: {
      studentId: student.id,
      date: punchDate,
      present: true,
      hoursTrained: effectiveHours,
      sessionType,
      status: 'PENDING',
      classId: resolvedClass?.id ?? null,
      isOutOfSchedule: resolvedClass ? !referenceIds.has(resolvedClass.id) : false,
      punchedAt: now,
      notes: result.data.notes ?? null,
    },
  })

  const practiceLines = result.data.practiceLogs ?? []
  let practiceWarning: string | null = null
  if (practiceLines.length > 0) {
    try {
      const practiceResult = await registerPracticeLogs(
        student.id,
        practiceLines.map((line) => ({
          techniqueId: line.techniqueId,
          repetitions: line.repetitions,
          place: (line.place ?? 'DOJO') as PracticePlace,
          notes: line.notes ?? null,
          attendanceId: attendance.id,
          date: punchDate,
        })),
      )
      if (practiceResult.invalid > 0) {
        practiceWarning = 'Algunas repeticiones no se registraron porque la técnica no pertenece al catálogo de la escuela.'
      }
    } catch (error) {
      console.error('Error registrando repeticiones del punch:', error)
      practiceWarning = 'No se pudieron guardar las repeticiones de técnicas. La asistencia sí quedó registrada.'
    }
  }

  await recordAudit({
    actorId: session.user.id,
    schoolId: student.schoolId,
    action: 'attendance.punch',
    targetType: 'Attendance',
    targetId: attendance.id,
    detail: {
      studentId: student.id,
      hoursTrained: attendance.hoursTrained,
      sessionType: attendance.sessionType,
      date: attendance.date.toISOString(),
      isOutOfSchedule: attendance.isOutOfSchedule,
      practiceLines: practiceLines.length,
    },
  })

  // Avisa a los administradores de la escuela para que revisen y confirmen el punch-in.
  await notifySchoolStaff({
    type: 'ATTENDANCE_PUNCHED',
    studentId: student.id,
    data: { hoursTrained: attendance.hoursTrained, className: resolvedClass?.name ?? null },
  })

  // Aviso por Telegram (best-effort) con enlace al panel de confirmación.
  await notifyAttendancePunchByTelegram({
    studentName: `${student.firstName} ${student.lastName}`,
    hoursTrained: attendance.hoursTrained,
    className: resolvedClass?.name ?? null,
    sessionType,
    date: attendance.date,
    isOutOfSchedule: attendance.isOutOfSchedule,
  })

  await notifyAttendancePunchByWhatsApp({
    studentName: `${student.firstName} ${student.lastName}`,
    hoursTrained: attendance.hoursTrained,
    className: resolvedClass?.name ?? null,
  })

  // Push al navegador/móvil de los administradores (el badge de no leídas ya
  // incluye la notificación in-app recién creada).
  await sendPushToSchoolAdmins(student.schoolId, {
    title: 'Nuevo punch-in',
    body: `${student.firstName} ${student.lastName} marcó ${attendance.hoursTrained}h${resolvedClass?.name ? ` en ${resolvedClass.name}` : ''}. Revísalo para confirmarlo.`,
    url: '/dashboard/admin/asistencia',
  })

  return NextResponse.json({
    record: {
      id: attendance.id,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      date: attendance.date.toISOString(),
      hoursTrained: attendance.hoursTrained,
      sessionType: attendance.sessionType,
      status: attendance.status,
      present: attendance.present,
      confirmedByName: null,
      notes: attendance.notes,
      punchedAt: attendance.punchedAt.toISOString(),
    },
    ...(practiceWarning ? { practiceWarning } : {}),
  }, { status: 201 })
}