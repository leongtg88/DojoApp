import { auth } from '@/auth'
import {
  createOnlineRecovery,
  getOnlineRecoveryActor,
  listOnlineRecoveryCandidates,
  listOnlineRecoveries,
} from '@/lib/dashboard/online-recovery'
import { notifyAssignment, notifyUser } from '@/lib/notifications/create'
import { recordAudit } from '@/lib/security/audit'
import { isSameOrigin, sameOriginResponse } from '@/lib/security/origin'
import { isHttpUrl } from '@/lib/validation/url'
import type { OnlineRecoveryStatus } from '@/types/dashboard'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const VALID_STATUSES: OnlineRecoveryStatus[] = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']

const createSchema = z.object({
  absenceId: z.string().trim().min(1).max(100),
  scheduledAt: z.string().trim().min(1).max(50),
  instructorId: z.string().trim().min(1).max(100).optional().nullable(),
  meetingUrl: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
})

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : ''

  if (message === 'NOT_FOUND') return NextResponse.json({ error: 'Falta no encontrada' }, { status: 404 })
  if (message === 'FORBIDDEN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (message === 'INVALID_DATE') return NextResponse.json({ error: 'La fecha debe ser futura' }, { status: 400 })
  if (message === 'INVALID_INSTRUCTOR') return NextResponse.json({ error: 'Instructor no válido' }, { status: 400 })
  if (message === 'STUDENT_INACTIVE') return NextResponse.json({ error: 'El alumno no está activo' }, { status: 409 })
  if (message === 'ALREADY_SCHEDULED') return NextResponse.json({ error: 'La falta ya tiene una clase online programada' }, { status: 409 })
  if (message === 'ALREADY_COMPLETED') return NextResponse.json({ error: 'La falta ya fue repuesta' }, { status: 409 })
  if (message === 'ALREADY_RECOVERED') return NextResponse.json({ error: 'La falta ya fue repuesta en otro horario' }, { status: 409 })
  if (message === 'INVALID_STATUS') return NextResponse.json({ error: 'El estado de la reposición no permite esa acción' }, { status: 409 })

  console.error('[online-recovery] Error inesperado:', error)
  return NextResponse.json({ error: 'No fue posible procesar la reposición' }, { status: 500 })
}

function normalizeUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const actor = await getOnlineRecoveryActor(session.user.id)
  if (!actor) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const url = new URL(request.url)
  const status = url.searchParams.get('status') as OnlineRecoveryStatus | null
  const search = url.searchParams.get('search')

  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
  }

  const [recoveries, candidates] = await Promise.all([
    listOnlineRecoveries(actor, { status }),
    listOnlineRecoveryCandidates(actor, search),
  ])

  return NextResponse.json({ recoveries, candidates })
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return sameOriginResponse()

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const actor = await getOnlineRecoveryActor(session.user.id)
  if (!actor) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const result = createSchema.safeParse(await request.json().catch(() => null))
  if (!result.success) return NextResponse.json({ error: 'Datos de la clase online no válidos' }, { status: 400 })

  const meetingUrl = normalizeUrl(result.data.meetingUrl)
  if (meetingUrl && !isHttpUrl(meetingUrl)) {
    return NextResponse.json({ error: 'El enlace de la videollamada no es válido' }, { status: 400 })
  }

  const scheduledAt = new Date(result.data.scheduledAt)

  try {
    const recovery = await createOnlineRecovery(actor, {
      absenceId: result.data.absenceId,
      scheduledAt,
      instructorId: result.data.instructorId ?? null,
      meetingUrl,
      notes: result.data.notes ?? null,
    })

    await notifyAssignment({
      type: 'ONLINE_RECOVERY_SCHEDULED',
      studentId: recovery.studentId,
      data: {
        scheduledAt: recovery.scheduledAt,
        durationMinutes: recovery.durationMinutes,
        instructorName: recovery.instructorName,
        meetingUrl: recovery.meetingUrl,
      },
    })

    if (recovery.instructorId && recovery.instructorId !== actor.userId) {
      await notifyUser({
        userId: recovery.instructorId,
        type: 'ONLINE_RECOVERY_ASSIGNED',
        studentId: recovery.studentId,
        studentName: recovery.studentName,
        data: {
          scheduledAt: recovery.scheduledAt,
          durationMinutes: recovery.durationMinutes,
          meetingUrl: recovery.meetingUrl,
        },
      })
    }

    await recordAudit({
      actorId: actor.userId,
      schoolId: actor.scope.schoolId,
      action: 'attendance.online_recovery_schedule',
      targetType: 'OnlineRecovery',
      targetId: recovery.id,
      detail: { studentId: recovery.studentId, absenceId: recovery.absenceId, scheduledAt: recovery.scheduledAt },
    })

    return NextResponse.json({ recovery }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
