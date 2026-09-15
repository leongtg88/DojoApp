import { db } from '@/lib/db'
import type { NotificationPriority, NotificationType } from '@/lib/generated/prisma'

export interface NotificationView {
  id: string
  type: NotificationType
  title: string
  body: string
  link: string | null
  priority: NotificationPriority
  readAt: string | null
  createdAt: string
}

interface NotificationCursorPage {
  items: NotificationView[]
  nextCursor: string | null
  unreadCount: number
}

function toView(notification: {
  id: string
  type: NotificationType
  title: string
  body: string
  link: string | null
  priority: NotificationPriority
  readAt: Date | null
  createdAt: Date
}): NotificationView {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    link: notification.link,
    priority: notification.priority,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return db.notification.count({ where: { userId, readAt: null } })
}

export async function listNotifications(
  userId: string,
  limit = 20,
  cursor?: string | null,
): Promise<NotificationCursorPage> {
  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
    getUnreadNotificationCount(userId),
  ])

  const hasMore = notifications.length > limit
  const items = (hasMore ? notifications.slice(0, limit) : notifications).map(toView)

  return {
    items,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
    unreadCount,
  }
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<boolean> {
  const result = await db.notification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: new Date() },
  })

  return result.count > 0
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const result = await db.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  })

  return result.count
}
