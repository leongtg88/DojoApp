import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// El barrido de subidas pendientes usa el storage; se sustituye por dobles.
vi.mock('@/lib/document-storage', () => ({
  listPrivateDocuments: async () => [],
  deletePrivateDocuments: async () => {},
}))
vi.mock('@/lib/integrations/whatsapp', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/integrations/whatsapp')>()
  return { ...actual, processWhatsAppQueue: async () => 0 }
})

const { db, resetDb } = await import('./db')
const purgeRoute = await import('@/app/api/cron/purge-enrollments/route')
const whatsappRoute = await import('@/app/api/cron/whatsapp/route')

const SECRET = 'cron-secret'

beforeAll(() => {
  process.env.CRON_SECRET = SECRET
})

afterAll(() => {
  delete process.env.CRON_SECRET
})

beforeEach(resetDb)

const request = (url: string, authorization?: string) =>
  new NextRequest(url, { headers: authorization ? { authorization } : {} })

// Cron protegidos por secreto (Vercel envía Bearer CRON_SECRET).
describe('cron', () => {
  it('rechaza sin el secreto correcto (401) y acepta con él', async () => {
    const unauthorized = await purgeRoute.GET(request('http://t/api/cron/purge-enrollments'))
    expect(unauthorized.status).toBe(401)

    const wrong = await purgeRoute.GET(request('http://t/api/cron/purge-enrollments', 'Bearer incorrecto'))
    expect(wrong.status).toBe(401)

    const ok = await purgeRoute.GET(request('http://t/api/cron/purge-enrollments', `Bearer ${SECRET}`))
    expect(ok.status).toBe(200)
  })

  it('purga las inscripciones PENDING antiguas', async () => {
    await db.enrollment.create({
      data: {
        origin: 'ASSISTANT',
        contactEmail: `stale-${randomUUID()}@test.dev`,
        status: 'PENDING',
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      },
    })
    await db.enrollment.create({
      data: { origin: 'ASSISTANT', contactEmail: `fresh-${randomUUID()}@test.dev`, status: 'PENDING' },
    })

    const res = await purgeRoute.GET(request('http://t/api/cron/purge-enrollments', `Bearer ${SECRET}`))

    expect(res.status).toBe(200)
    const body = (await res.json()) as { purged: number; pendingPurged: number }
    expect(body.purged).toBe(1)
    expect(await db.enrollment.count()).toBe(1)
  })

  it('el cron de WhatsApp responde con lo enviado', async () => {
    const res = await whatsappRoute.GET(request('http://t/api/cron/whatsapp', `Bearer ${SECRET}`))
    expect(res.status).toBe(200)
    expect((await res.json()) as { sent: number }).toMatchObject({ sent: 0 })
  })

  it('sin CRON_SECRET configurado no exige autorización', async () => {
    const secret = process.env.CRON_SECRET
    delete process.env.CRON_SECRET
    try {
      const res = await whatsappRoute.GET(request('http://t/api/cron/whatsapp'))
      expect(res.status).toBe(200)
    } finally {
      process.env.CRON_SECRET = secret
    }
  })
})
