import webpush from 'web-push'
import { db } from '@/lib/db'

export interface PushPayload {
  title: string
  body: string
  url?: string
}

interface PushSubscriptionRecord {
  endpoint: string
  p256dh: string
  auth: string
}

let configured = false

export function isPushConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT)
}

function configure(): boolean {
  if (configured) return true
  if (!isPushConfigured()) return false

  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT as string,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
      process.env.VAPID_PRIVATE_KEY as string,
    )
    configured = true
    return true
  } catch (error) {
    console.error('[push] No fue posible configurar las claves VAPID', error)
    return false
  }
}

async function sendToSubscriptions(subscriptions: PushSubscriptionRecord[], payload: PushPayload): Promise<void> {
  if (subscriptions.length === 0) return

  const body = JSON.stringify(payload)

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          body,
        )
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          await db.pushSubscription.deleteMany({ where: { endpoint: subscription.endpoint } })
          return
        }
        console.error('[push] No fue posible enviar la notificación', subscription.endpoint, error)
      }
    }),
  )
}

/**
 * Envía una notificación push a usuarios concretos.
 * Es "best-effort": nunca lanza error para no romper el flujo que la invoca.
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  if (!configure()) return

  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)))
  if (uniqueUserIds.length === 0) return

  try {
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId: { in: uniqueUserIds } },
      select: { endpoint: true, p256dh: true, auth: true },
    })
    await sendToSubscriptions(subscriptions, payload)
  } catch (error) {
    console.error('[push] No fue posible obtener las suscripciones', error)
  }
}

/**
 * Envía una notificación push a los administradores de una escuela.
 */
export async function sendPushToSchoolAdmins(schoolId: string | null | undefined, payload: PushPayload): Promise<void> {
  if (!configure() || !schoolId) return

  try {
    const staff = await db.user.findMany({
      where: { roles: { has: 'SCHOOL_ADMIN' }, schoolId },
      select: { id: true },
    })
    await sendPushToUsers(staff.map((member) => member.id), payload)
  } catch (error) {
    console.error('[push] No fue posible enviar la notificación a los administradores', schoolId, error)
  }
}
