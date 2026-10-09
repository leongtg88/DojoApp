import { auth } from '@/auth'
import { db } from '@/lib/db'
import { hasAnyRole } from '@/lib/auth/roles'
import { resolveRequestStudent } from '@/lib/family/guardians'
import { registerPracticeLogs } from '@/lib/dashboard/technique-reps'
import { consumeRateLimit, rateLimitResponse, getClientIp } from '@/lib/security/rate-limit'
import { ATTENDANCE_LIMITS } from '@/lib/dashboard/attendance-limits'
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

const practiceSchema = z.object({
  practiceLogs: z.array(practiceLineSchema).min(1).max(30),
  date: z
    .string()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), { message: 'Fecha de práctica inválida' })
    .optional(),
})

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return sameOriginResponse()
  }

  const session = await auth()

  if (!session?.user?.id || !hasAnyRole(session?.user, ['STUDENT', 'GUARDIAN'])) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const ipAttempt = await consumeRateLimit(`technique-practice:ip:${getClientIp(request.headers)}`, {
    limit: ATTENDANCE_LIMITS.maxPunchesPerHourIp,
    windowMs: 60 * 60 * 1000,
  })
  if (!ipAttempt.allowed) {
    return rateLimitResponse(ipAttempt.retryAfterSeconds, 'Demasiados registros desde esta conexión. Inténtalo de nuevo más tarde.')
  }

  const result = practiceSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de práctica no válidos' }, { status: 400 })
  }

  const view = await resolveRequestStudent(request, session.user.id)
  if (!view) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const studentAttempt = await consumeRateLimit(`technique-practice:student:${view.studentId}`, {
    limit: ATTENDANCE_LIMITS.maxPunchesPerHourStudent,
    windowMs: 60 * 60 * 1000,
  })
  if (!studentAttempt.allowed) {
    return rateLimitResponse(studentAttempt.retryAfterSeconds, 'Has registrado varias prácticas en poco tiempo. Espera unos minutos.')
  }

  const student = await db.student.findUnique({
    where: { id: view.studentId },
    select: { id: true },
  })

  if (!student) {
    return NextResponse.json({ error: 'Perfil de estudiante no encontrado' }, { status: 404 })
  }

  const practiceDate = result.data.date ? new Date(result.data.date) : new Date()
  const dailyReps = result.data.practiceLogs.reduce((total, line) => total + line.repetitions, 0)

  if (dailyReps > ATTENDANCE_LIMITS.maxDailySelfReportedReps) {
    return NextResponse.json(
      { error: `Superaste el máximo de ${ATTENDANCE_LIMITS.maxDailySelfReportedReps} repeticiones por día.` },
      { status: 429 },
    )
  }

  try {
    const practiceResult = await registerPracticeLogs(
      student.id,
      result.data.practiceLogs.map((line) => ({
        techniqueId: line.techniqueId,
        repetitions: line.repetitions,
        place: (line.place ?? 'DOJO') as PracticePlace,
        notes: line.notes ?? null,
        date: practiceDate,
      })),
    )

    return NextResponse.json(
      {
        ok: true,
        registered: practiceResult.created,
        ...(practiceResult.invalid > 0
          ? { practiceWarning: 'Algunas repeticiones no se registraron porque la técnica no pertenece al catálogo de la escuela.' }
          : {}),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error registrando repeticiones de técnicas:', error)
    return NextResponse.json({ error: 'No se pudieron guardar las repeticiones' }, { status: 500 })
  }
}
