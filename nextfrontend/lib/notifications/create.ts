import { db } from '@/lib/db'
import type { NotificationType, Prisma } from '@/lib/generated/prisma'
import { buildNotificationContent } from './types'

interface NotifyAssignmentParams {
  type: NotificationType
  studentId: string
  count?: number
  data?: Prisma.InputJsonValue
}

/**
 * Crea notificaciones in-app para un alumno y sus tutores.
 * Es "best-effort": nunca lanza error para no romper el flujo de negocio que la invoca.
 */
export async function notifyAssignment({
  type,
  studentId,
  count = 1,
  data,
}: NotifyAssignmentParams): Promise<void> {
  try {
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        userId: true,
        guardianId: true,
        guardians: { select: { guardianId: true } },
      },
    })

    if (!student) {
      return
    }

    const recipients = [
      ...new Set(
        [student.userId, student.guardianId, ...student.guardians.map((entry) => entry.guardianId)].filter(
          (id): id is string => Boolean(id),
        ),
      ),
    ]

    if (recipients.length === 0) {
      return
    }

    const jsonData = (data ?? {}) as Prisma.InputJsonValue
    const content = buildNotificationContent(type, {
      studentName: student.firstName,
      count,
      data: (jsonData ?? {}) as Record<string, unknown>,
    })

    await db.notification.createMany({
      data: recipients.map((userId) => ({
        userId,
        studentId: student.id,
        type,
        title: content.title,
        body: content.body,
        link: content.link,
        priority: content.priority,
        data: jsonData,
      })),
    })
  } catch (error) {
    console.error('[notifications] No fue posible crear la notificación', type, studentId, error)
  }
}
