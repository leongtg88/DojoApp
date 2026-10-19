import { createHmac } from 'node:crypto'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Solo se neutraliza el envío real; `normalizePhone` se evalúa de verdad.
vi.mock('@/lib/integrations/whatsapp', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/integrations/whatsapp')>()
  return { ...actual, sendWhatsAppText: async () => {} }
})

const { db, resetDb } = await import('./db')
const webhookRoute = await import('@/app/api/webhooks/whatsapp/route')

const APP_SECRET = 'test-app-secret'
const VERIFY_TOKEN = 'test-verify-token'

beforeAll(() => {
  process.env.WHATSAPP_APP_SECRET = APP_SECRET
  process.env.WHATSAPP_VERIFY_TOKEN = VERIFY_TOKEN
  delete process.env.WHATSAPP_AUTO_REPLY
})

beforeEach(resetDb)

const sign = (body: string) => `sha256=${createHmac('sha256', APP_SECRET).update(body).digest('hex')}`

function postWebhook(rawBody: string, signature?: string) {
  return new NextRequest('http://t/api/webhooks/whatsapp', {
    method: 'POST',
    headers: signature ? { 'x-hub-signature-256': signature } : {},
    body: rawBody,
  })
}

function verifyRequest(mode: string, token: string, challenge = 'CHALLENGE-123') {
  return new NextRequest(`http://t/api/webhooks/whatsapp?hub.mode=${mode}&hub.verify_token=${token}&hub.challenge=${challenge}`)
}

// Flujo público · Webhook de WhatsApp (verificación de firma de Meta).
describe('webhook de WhatsApp', () => {
  it('responde el challenge solo con el verify token correcto', async () => {
    const ok = await webhookRoute.GET(verifyRequest('subscribe', VERIFY_TOKEN))
    expect(ok.status).toBe(200)
    expect(await ok.text()).toBe('CHALLENGE-123')

    const bad = await webhookRoute.GET(verifyRequest('subscribe', 'incorrecto'))
    expect(bad.status).toBe(403)
  })

  it('rechaza una firma inválida (403) y acepta la válida', async () => {
    const body = JSON.stringify({ object: 'whatsapp_business_account', entry: [] })

    const invalid = await webhookRoute.POST(postWebhook(body, 'sha256=deadbeef'))
    expect(invalid.status).toBe(403)

    const valid = await webhookRoute.POST(postWebhook(body, sign(body)))
    expect(valid.status).toBe(200)
  })

  it('registra un mensaje entrante y su contacto', async () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [{ changes: [{ value: { contacts: [{ wa_id: '18095550001' }], messages: [{ from: '18095550001', id: 'wamid.IN1', type: 'text', text: { body: 'Hola' } }] } }] }],
    }
    const raw = JSON.stringify(payload)

    const res = await webhookRoute.POST(postWebhook(raw, sign(raw)))

    expect(res.status).toBe(200)
    const contact = await db.whatsAppContact.findUniqueOrThrow({ where: { phone: '+18095550001' } })
    const message = await db.whatsAppMessage.findUniqueOrThrow({ where: { wamid: 'wamid.IN1' } })
    expect(message.direction).toBe('INBOUND')
    expect(message.contactId).toBe(contact.id)
    expect(message.body).toBe('Hola')
  })

  it('procesa la baja (STOP) desactivando el opt-in', async () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [{ changes: [{ value: { contacts: [{ wa_id: '18095550002' }], messages: [{ from: '18095550002', id: 'wamid.IN2', type: 'text', text: { body: 'BAJA' } }] } }] }],
    }
    const raw = JSON.stringify(payload)

    await webhookRoute.POST(postWebhook(raw, sign(raw)))

    const contact = await db.whatsAppContact.findUniqueOrThrow({ where: { phone: '+18095550002' } })
    expect(contact.optIn).toBe(false)
    expect(contact.optOutAt).not.toBeNull()
  })

  it('actualiza el estado de entrega de un mensaje saliente', async () => {
    await db.whatsAppMessage.create({ data: { direction: 'OUTBOUND', wamid: 'wamid.OUT1', toNumber: '+18095550003', status: 'SENT' } })
    const payload = { object: 'whatsapp_business_account', entry: [{ changes: [{ value: { statuses: [{ id: 'wamid.OUT1', status: 'delivered' }] } }] }] }
    const raw = JSON.stringify(payload)

    await webhookRoute.POST(postWebhook(raw, sign(raw)))

    const message = await db.whatsAppMessage.findUniqueOrThrow({ where: { wamid: 'wamid.OUT1' } })
    expect(message.status).toBe('DELIVERED')
  })
})
