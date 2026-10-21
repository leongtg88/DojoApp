import { auth } from '@/auth'
import {
  cancelOnlineRecovery,
  completeOnlineRecovery,
  getOnlineRecoveryActor,
  informOnlineRecoveryCost,
  markOnlineRecoveryNoShow,
  rescheduleOnlineRecovery,
} from '@/lib/dashboard/online-recovery'
import { notifyAssignment, notifyUser } from '@/lib/notifications/create'
import { recordAudit } from '@/lib/security/audit'
import { isSameOrigin, sameOriginResponse } from '@/lib/security/origin'
import { isHttpUrl } from '@/lib/validation/url'
import type { OnlineRecoverySummary } from '@/types/dashboard'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const actionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('reschedule'),
    scheduledAt: z.string().trim().min(1).max(50),
    instructorId: z.string().trim().min(1).max(100).optional().nullable(),
    meetingUrl: z.string().trim().max(500).optional().nullable(),
    notes: z.string().trim().max(500).optional().nullable(),
  }),
  z.object({ action: z.literal('complete') }),
  z.object({ action: z.literal('cancel') }),
  z.object({ action: z.literal('no-show') }),
  z.object({
    action: z.literal('cost'),
    costAmount: z.number().min(0).max(1_000_000),
    costCurrency: z.string().trim().length(3),
    costNote: z.string().trim().max(500).optional().nullable(),
  }),
])

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : ''

  if (message === 'NOT_FOUND') return NextResponse.json({ error: 'Reposición no encontrada' }, { status: 404 })
  if (message === 'FORBIDDEN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (message === 'INVALID_DATE') return NextResponse.json({ error: 'La fecha debe ser futura' }, { status: 400 })
  if (message === 'INVALID_INSTRUCTOR') return NextResponse.json({ error: 'Instructor no válido' }, { status: 400 })
  if (message === 'INVALID_STATUS') return NextResponse.json({ error: 'El estado de la reposición no permite esa acción' }, { status: 409 })
  if (message === 'ALREADY_COMPLETED') return NextResponse.json({ error: 'La falta ya fue repuesta' }, { status: 409 })
  if (message === 'ALREADY_RECOVERED') return NextResponse.json({ error: 'La falta ya fue repuesta en otro horario' }, { status: 409 })

  console.error('[online-recovery] Error inesperado:', error)
  return NextResponse.json({ error: 'No fue posible procesar la reposición' }, { status: 500 })
}

function normalizeUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function baseNotificationData(recovery: OnlineRecoverySummary) {
  return {
    scheduledAt: recovery.scheduledAt,
    durationMinutes: recovery.durationMinutes,
    instructorName: recovery.instructorName,
    meetingUrl: recovery.meetingUrl,
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ recoveryId: string }> },
) {
  if (!isSameOrigin(request)) return sameOriginResponse()

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const actor = await getOnlineRecoveryActor(session.user.id)
  if (!actor) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const result = actionSchema.safeParse(await request.json().catch(() => null))
  if (!result.success) return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })

  const { recoveryId } = await params

  try {
    if (result.data.action === 'reschedule') {
      const meetingUrl = normalizeUrl(result.data.meetingUrl)
      if (meetingUrl && !isHttpUrl(meetingUrl)) {
        return NextResponse.json({ error: 'El enlace de la videollamada no es válido' }, { status: 400 })
      }

      const recovery = await rescheduleOnlineRecovery(actor, recoveryId, {
        scheduledAt: new Date(result.data.scheduledAt),
        instructorId: result.data.instructorId,
        meetingUrl,
        notes: result.data.notes ?? null,
      })

      await notifyAssignment({
        type: 'ONLINE_RECOVERY_RESCHEDULED',
        studentId: recovery.studentId,
        data: baseNotificationData(recovery),
      })

      if (recovery.instructorId && recovery.instructorId !== actor.userId) {
        await notifyUser({
          userId: recovery.instructorId,
          type: 'ONLINE_RECOVERY_ASSIGNED',
          studentId: recovery.studentId,
          studentName: recovery.studentName,
          data: baseNotificationData(recovery),
        })
      }

      await recordAudit({
        actorId: actor.userId,
        schoolId: actor.scope.schoolId,
        action: 'attendance.online_recovery_reschedule',
        targetType: 'OnlineRecovery',
        targetId: recovery.id,
        detail: { studentId: recovery.studentId, scheduledAt: recovery.scheduledAt },
      })

      return NextResponse.json({ recovery })
    }

    if (result.data.action === 'complete') {
      const recovery = await completeOnlineRecovery(actor, recoveryId)

      await notifyAssignment({
        type: 'ONLINE_RECOVERY_COMPLETED',
        studentId: recovery.studentId,
        data: baseNotificationData(recovery),
      })

      await recordAudit({
        actorId: actor.userId,
        schoolId: actor.scope.schoolId,
        action: 'attendance.online_recovery_complete',
        targetType: 'OnlineRecovery',
        targetId: recovery.id,
        detail: { studentId: recovery.studentId, absenceId: recovery.absenceId },
      })

      return NextResponse.json({ recovery })
    }

    if (result.data.action === 'cancel') {
      const recovery = await cancelOnlineRecovery(actor, recoveryId)

      await notifyAssignment({
        type: 'ONLINE_RECOVERY_CANCELLED',
        studentId: recovery.studentId,
        data: baseNotificationData(recovery),
      })

      await recordAudit({
        actorId: actor.userId,
        schoolId: actor.scope.schoolId,
        action: 'attendance.online_recovery_cancel',
        targetType: 'OnlineRecovery',
        targetId: recovery.id,
        detail: { studentId: recovery.studentId },
      })

      return NextResponse.json({ recovery })
    }

    if (result.data.action === 'no-show') {
      const recovery = await markOnlineRecoveryNoShow(actor, recoveryId)

      await notifyAssignment({
        type: 'ONLINE_RECOVERY_NO_SHOW',
        studentId: recovery.studentId,
        data: baseNotificationData(recovery),
      })

      await recordAudit({
        actorId: actor.userId,
        schoolId: actor.scope.schoolId,
        action: 'attendance.online_recovery_no_show',
        targetType: 'OnlineRecovery',
        targetId: recovery.id,
        detail: { studentId: recovery.studentId },
      })

      return NextResponse.json({ recovery })
    }

    const recovery = await informOnlineRecoveryCost(actor, recoveryId, {
      costAmount: result.data.costAmount,
      costCurrency: result.data.costCurrency,
      costNote: result.data.costNote ?? null,
    })

    await notifyAssignment({
      type: 'ONLINE_RECOVERY_COST_INFORMED',
      studentId: recovery.studentId,
      data: {
        ...baseNotificationData(recovery),
        costAmount: recovery.costAmount,
        costCurrency: recovery.costCurrency,
      },
    })

    await recordAudit({
      actorId: actor.userId,
      schoolId: actor.scope.schoolId,
      action: 'attendance.online_recovery_cost',
      targetType: 'OnlineRecovery',
      targetId: recovery.id,
      detail: {
        studentId: recovery.studentId,
        costAmount: recovery.costAmount,
        costCurrency: recovery.costCurrency,
      },
    })

    return NextResponse.json({ recovery })
  } catch (error) {
    return errorResponse(error)
  }
}
