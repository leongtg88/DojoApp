import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/auth', async () => {
  const mod = await import('./route-auth')
  return { auth: mod.authMock.auth }
})

// Solo se sustituye el envío real a Meta; la ventana y la configuración se
// evalúan de verdad (con variables de entorno de prueba).
vi.mock('@/lib/integrations/whatsapp', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/integrations/whatsapp')>()
  return { ...actual, sendWhatsAppTextNow: async () => ({ ok: true, wamid: 'wamid.test' }) }
})

const { db, resetDb } = await import('./db')
const { authMock } = await import('./route-auth')
const { jsonRequest, readJson } = await import('./http')
const { createSchool, createUser } = await import('./fixtures')

const messagesRoute = await import('@/app/api/dashboard/admin/whatsapp/messages/route')

async function loginAsAdmin(schoolId: string) {
  const admin = await createUser({ email: `a-${randomUUID()}@test.dev`, roles: ['SCHOOL_ADMIN'], schoolId })
  authMock.setUser(admin.id, { roles: ['SCHOOL_ADMIN'], schoolId })
  return admin
}

async function makeContact(phone: string, lastInboundAt: Date | null) {
  return db.whatsAppContact.create({
    data: { phone, optIn: true, lastInboundAt },
    select: { id: true },
  })
}

beforeAll(() => {
  process.env.WHATSAPP_ACCESS_TOKEN = 'test-token'
  process.env.WHATSAPP_PHONE_NUMBER_ID = '123456'
})

afterAll(() => {
  delete process.env.WHATSAPP_ACCESS_TOKEN
  delete process.env.WHATSAPP_PHONE_NUMBER_ID
})

beforeEach(async () => {
  await resetDb()
  authMock.setUser(null)
})

// Fase 7 · F7-04 — Mensajes de WhatsApp: ventana de 24h.
describe('F7-04 · mensajes de WhatsApp', () => {
  it('envía dentro de la ventana de 24h', async () => {
    const school = await createSchool()
    await loginAsAdmin(school.id)
    const contact = await makeContact('+18095550001', new Date())

    const res = await messagesRoute.POST(
      jsonRequest('http://t/x', 'POST', { contactId: contact.id, body: 'Hola' }),
    )
    expect(res.status).toBe(200)
    expect((await readJson<{ wamid: string }>(res)).wamid).toBe('wamid.test')
  })

  it('bloquea fuera de la ventana de 24h (409)', async () => {
    const school = await createSchool()
    await loginAsAdmin(school.id)
    const contact = await makeContact('+18095550002', new Date(Date.now() - 25 * 60 * 60 * 1000))

    const res = await messagesRoute.POST(
      jsonRequest('http://t/x', 'POST', { contactId: contact.id, body: 'Hola' }),
    )
    expect(res.status).toBe(409)
    expect((await readJson<{ code: string }>(res)).code).toBe('OUTSIDE_WINDOW')
  })

  it('responde 503 si WhatsApp no está configurado', async () => {
    const token = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    delete process.env.WHATSAPP_ACCESS_TOKEN
    delete process.env.WHATSAPP_PHONE_NUMBER_ID
    try {
      const school = await createSchool()
      await loginAsAdmin(school.id)
      const contact = await makeContact('+18095550003', new Date())

      const res = await messagesRoute.POST(
        jsonRequest('http://t/x', 'POST', { contactId: contact.id, body: 'Hola' }),
      )
      expect(res.status).toBe(503)
      expect((await readJson<{ code: string }>(res)).code).toBe('NOT_CONFIGURED')
    } finally {
      process.env.WHATSAPP_ACCESS_TOKEN = token
      process.env.WHATSAPP_PHONE_NUMBER_ID = phoneNumberId
    }
  })

  it('responde 404 si el contacto no existe', async () => {
    const school = await createSchool()
    await loginAsAdmin(school.id)

    const res = await messagesRoute.POST(jsonRequest('http://t/x', 'POST', { contactId: 'no-existe', body: 'Hola' }))
    expect(res.status).toBe(404)
  })
})
