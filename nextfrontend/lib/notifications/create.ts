import { db } from '@/lib/db'
import type { NotificationType, Prisma } from '@/lib/generated/prisma'
import { buildNotificationContent } from './types'
import { dispatchStaffNotification, dispatchStudentNotification } from '@/lib/integrations/whatsapp'

interface NotifyAssignmentParams {
  type: NotificationType
  studentId: string
  count?: number
  data?: Prisma.InputJsonValue
}

interface CreateForRecipientsParams {
  userIds: (string | null | undefined)[]
  studentId: string | null
  studentName: string
  type: NotificationType
  count: number
  data?: Prisma.InputJsonValue
}

async function createForRecipients({
  userIds,
  studentId,
  studentName,
  type,
  count,
  data,
}: CreateForRecipientsParams): Promise<void> {
  const recipients = [...new Set(userIds.filter((id): id is string => Boolean(id)))]

  if (recipients.length === 0) {
    return
  }

  const jsonData = (data ?? {}) as Prisma.InputJsonValue
  const content = buildNotificationContent(type, {
    studentName,
    studentId: studentId ?? '',
    count,
    data: (jsonData ?? {}) as Record<string, unknown>,
  })

  await db.notification.createMany({
    data: recipients.map((userId) => ({
      userId,
      studentId,
      type,
      title: content.title,
      body: content.body,
      link: content.link,
      priority: content.priority,
      data: jsonData,
    })),
  })
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
      student.userId,
      student.guardianId,
      ...student.guardians.map((entry) => entry.guardianId),
    ]

    await createForRecipients({
      userIds: recipients,
      studentId: student.id,
      studentName: student.firstName,
      type,
      count,
      data,
    })

    await dispatchStudentNotification({
      type,
      studentId: student.id,
      studentName: student.firstName,
      count,
      data: (data ?? {}) as Record<string, unknown>,
    })
  } catch (error) {
    console.error('[notifications] No fue posible crear la notificación', type, studentId, error)
  }
}

/**
 * Crea notificaciones in-app para los administradores de la escuela del alumno.
 * Es "best-effort": nunca lanza error para no romper el flujo de negocio que la invoca.
 */
export async function notifySchoolStaff({
  type,
  studentId,
  count = 1,
  data,
}: NotifyAssignmentParams): Promise<void> {
  try {
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { id: true, firstName: true, schoolId: true },
    })

    if (!student) {
      return
    }

    const staff = await db.user.findMany({
      where: { roles: { has: 'SCHOOL_ADMIN' }, schoolId: student.schoolId },
      select: { id: true },
    })

    await createForRecipients({
      userIds: staff.map((member) => member.id),
      studentId: student.id,
      studentName: student.firstName,
      type,
      count,
      data,
    })

    await dispatchStaffNotification({
      type,
      studentName: student.firstName,
      data: (data ?? {}) as Record<string, unknown>,
    })
  } catch (error) {
    console.error('[notifications] No fue posible crear la notificación al staff', type, studentId, error)
  }
}

/**
 * Crea notificaciones in-app para el staff cuando se recibe una reseña pública:
 * los administradores de la escuela dueña de la reseña y todos los superadmins.
 * Es "best-effort": nunca lanza error para no romper el flujo público.
 */
export async function notifyReviewSubmitted({
  schoolId,
  reviewId,
  authorName,
  rating,
}: {
  schoolId: string | null
  reviewId: string
  authorName: string
  rating: number
}): Promise<void> {
  try {
    const orClauses: Prisma.UserWhereInput[] = [{ roles: { has: 'SUPERADMIN' } }]

    if (schoolId) {
      orClauses.push({ roles: { has: 'SCHOOL_ADMIN' }, schoolId })
    }

    const staff = await db.user.findMany({
      where: { OR: orClauses },
      select: { id: true },
    })

    await createForRecipients({
      userIds: staff.map((member) => member.id),
      studentId: null,
      studentName: authorName,
      type: 'REVIEW_SUBMITTED',
      count: 1,
      data: { reviewId, authorName, rating },
    })
  } catch (error) {
    console.error('[notifications] No fue posible crear la notificación de reseña', reviewId, error)
  }
}
