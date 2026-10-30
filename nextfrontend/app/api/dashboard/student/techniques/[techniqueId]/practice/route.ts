import { auth } from '@/auth'
import { hasAnyRole } from '@/lib/auth/roles'
import { resolveRequestStudent } from '@/lib/family/guardians'
import { registerPracticeLogs, removePracticeLog } from '@/lib/dashboard/technique-reps'
import { consumeRateLimit, rateLimitResponse, getClientIp } from '@/lib/security/rate-limit'
import { ATTENDANCE_LIMITS } from '@/lib/dashboard/attendance-limits'
import { isSameOrigin, sameOriginResponse } from '@/lib/security/origin'
import type { PracticePlace } from '@/lib/generated/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const practiceLogSchema = z.object({
  repetitions: z.number().int().min(1).max(100_000),
  place: z.enum(['DOJO', 'FUERA']).optional(),
  notes: z.string().trim().max(1_000).nullable().optional(),
  date: z
    .string()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), { message: 'Fecha de práctica inválida' })
    .optional(),
})

interface PracticeRouteContext {
  params: Promise<{ techniqueId: string }>
}

export async function POST(request: Request, { params }: PracticeRouteContext) {
  if (!isSameOrigin(request)) return sameOriginResponse()

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

  const result = practiceLogSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de práctica no válidos' }, { status: 400 })
  }

  if (result.data.repetitions > ATTENDANCE_LIMITS.maxDailySelfReportedReps) {
    return NextResponse.json(
      { error: `Superaste el máximo de ${ATTENDANCE_LIMITS.maxDailySelfReportedReps} repeticiones por día.` },
      { status: 429 },
    )
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

  const { techniqueId } = await params
  const { created, invalid } = await registerPracticeLogs(view.studentId, [
    {
      techniqueId,
      repetitions: result.data.repetitions,
      place: (result.data.place ?? 'DOJO') as PracticePlace,
      notes: result.data.notes ?? null,
      date: result.data.date ? new Date(result.data.date) : undefined,
    },
  ])

  if (created === 0) {
    const message = invalid > 0 ? 'La técnica no pertenece al catálogo de tu escuela' : 'No se pudo registrar la práctica'
    return NextResponse.json({ error: message }, { status: invalid > 0 ? 400 : 404 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return sameOriginResponse()

  const session = await auth()

  if (!session?.user?.id || !hasAnyRole(session?.user, ['STUDENT', 'GUARDIAN'])) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const logId = new URL(request.url).searchParams.get('logId')

  if (!logId) {
    return NextResponse.json({ error: 'Registro no especificado' }, { status: 400 })
  }

  const view = await resolveRequestStudent(request, session.user.id)

  if (!view) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const removed = await removePracticeLog(view.studentId, logId)

  if (!removed) {
    return NextResponse.json({ error: 'Registro de práctica no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
