import { auth } from '@/auth'
import { db } from '@/lib/db'
import { hasAnyRole } from '@/lib/auth/roles'
import { resolveRequestStudent } from '@/lib/family/guardians'
import { resolveClassByTime, classHours, formatTime } from '@/lib/dashboard/balance'
import { registerPracticeLogs } from '@/lib/dashboard/technique-reps'
import { notifySchoolStaff } from '@/lib/notifications/create'
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
  hoursTrained: z.number().min(0.5).max(12).optional(),
  sessionType: z.string().trim().min(1).max(50).optional(),
  date: z.string().refine((value) => !Number.isNaN(new Date(value).getTime()), { message: 'Fecha de práctica inválida' }).optional(),
  notes: z.string().trim().max(500).optional().nullable(),
  practiceLogs: z.array(practiceLineSchema).max(30).optional(),
})

const SESSION_TYPES = ['class', 'private', 'autonomous', 'seminar', 'other'] as const

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id || !hasAnyRole(session?.user, ['STUDENT', 'GUARDIAN'])) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
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

  const student = await db.student.findUnique({
    where: { id: view.studentId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      branchId: true,
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

  // El cliente envía el instante con zona (ISO), así que el día de referencia
  // para evitar duplicados se calcula en límites UTC, consistente en cualquier zona.
  const startOfDay = new Date(Date.UTC(punchDate.getUTCFullYear(), punchDate.getUTCMonth(), punchDate.getUTCDate()))
  const startOfNextDay = new Date(Date.UTC(punchDate.getUTCFullYear(), punchDate.getUTCMonth(), punchDate.getUTCDate() + 1))

  const existing = await db.attendance.findFirst({
    where: {
      studentId: student.id,
      sessionId: null,
      date: { gte: startOfDay, lt: startOfNextDay },
    },
    select: { id: true },
  })

  if (existing) {
    return NextResponse.json({ error: 'Ya registraste tu práctica en esa fecha. Puedes editarla mientras esté pendiente.' }, { status: 409 })
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

  const attendance = await db.attendance.create({
    data: {
      studentId: student.id,
      date: punchDate,
      present: true,
      hoursTrained: result.data.hoursTrained ?? (resolvedClass ? classHours(resolvedClass) : 1),
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
      const registered = await registerPracticeLogs(
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
      if (registered === 0) {
        practiceWarning = 'No se pudo registrar las repeticiones (técnicas no asignadas al expediente).'
      }
    } catch (error) {
      console.error('Error registrando repeticiones del punch:', error)
      practiceWarning = 'No se pudieron guardar las repeticiones de técnicas. La asistencia sí quedó registrada.'
    }
  }

  // Avisa a los administradores de la escuela para que revisen y confirmen el punch-in.
  await notifySchoolStaff({
    type: 'ATTENDANCE_PUNCHED',
    studentId: student.id,
    data: { hoursTrained: attendance.hoursTrained, className: resolvedClass?.name ?? null },
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