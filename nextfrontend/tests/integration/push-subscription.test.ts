import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/auth', async () => {
  const mod = await import('./route-auth')
  return { auth: mod.authMock.auth }
})

const { db, resetDb } = await import('./db')
const { authMock } = await import('./route-auth')
const { jsonRequest } = await import('./http')
const { createUser } = await import('./fixtures')

const subscribeRoute = await import('@/app/api/push/subscribe/route')
const unsubscribeRoute = await import('@/app/api/push/unsubscribe/route')

async function loginAsUser() {
  const user = await createUser({ email: `u-${randomUUID()}@test.dev`, roles: ['STUDENT'] })
  authMock.setUser(user.id, { roles: ['STUDENT'] })
  return user
}

const subscription = { endpoint: 'https://push.example/abc', keys: { p256dh: 'clave-p256dh', auth: 'clave-auth' } }

beforeEach(async () => {
  await resetDb()
  authMock.setUser(null)
})

// Flujo público · Suscripción Web Push (autenticada).
describe('push · suscripción', () => {
  it('exige sesión (403) en subscribe y unsubscribe', async () => {
    authMock.setUser(null)
    expect((await subscribeRoute.POST(jsonRequest('http://t/api/push/subscribe', 'POST', subscription))).status).toBe(403)
    expect((await unsubscribeRoute.POST(jsonRequest('http://t/api/push/unsubscribe', 'POST', { endpoint: subscription.endpoint }))).status).toBe(403)
  })

  it('rechaza una suscripción inválida (400)', async () => {
    await loginAsUser()
    const res = await subscribeRoute.POST(jsonRequest('http://t/api/push/subscribe', 'POST', { endpoint: 'no-es-url' }))
    expect(res.status).toBe(400)
  })

  it('guarda la suscripción y la elimina al darse de baja', async () => {
    const user = await loginAsUser()

    const saved = await subscribeRoute.POST(jsonRequest('http://t/api/push/subscribe', 'POST', subscription))
    expect(saved.status).toBe(200)
    const row = await db.pushSubscription.findUniqueOrThrow({ where: { endpoint: subscription.endpoint } })
    expect(row.userId).toBe(user.id)
    expect(row.p256dh).toBe('clave-p256dh')

    const removed = await unsubscribeRoute.POST(jsonRequest('http://t/api/push/unsubscribe', 'POST', { endpoint: subscription.endpoint }))
    expect(removed.status).toBe(200)
    expect(await db.pushSubscription.count()).toBe(0)
  })

  it('no elimina la suscripción de otro usuario', async () => {
    const other = await createUser({ email: `o-${randomUUID()}@test.dev`, roles: ['STUDENT'] })
    await db.pushSubscription.create({ data: { userId: other.id, endpoint: subscription.endpoint, p256dh: 'p', auth: 'a' } })
    await loginAsUser()

    const res = await unsubscribeRoute.POST(jsonRequest('http://t/api/push/unsubscribe', 'POST', { endpoint: subscription.endpoint }))

    expect(res.status).toBe(200)
    expect(await db.pushSubscription.count()).toBe(1)
  })
})
