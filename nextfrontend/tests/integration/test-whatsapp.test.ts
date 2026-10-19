import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

vi.mock('@/lib/integrations/whatsapp', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/integrations/whatsapp')>()
  return {
    ...actual,
    isWhatsAppConfigured: vi.fn(() => true),
    sendWhatsAppTextNow: vi.fn(),
    sendWhatsAppTemplate: vi.fn(),
  }
})

const { resetDb } = await import('./db')
const { jsonRequest, readJson } = await import('./http')
const whatsapp = await import('@/lib/integrations/whatsapp')
const route = await import('@/app/api/test-whatsapp/route')

const URL = 'http://t/api/test-whatsapp'

function post(body?: unknown, headers: Record<string, string> = {}): Promise<Response> {
  const request = jsonRequest(URL, 'POST', body)
  for (const [key, value] of Object.entries(headers)) request.headers.set(key, value)
  return route.POST(request as unknown as NextRequest)
}

beforeEach(async () => {
  await resetDb()
  vi.clearAllMocks()
  vi.mocked(whatsapp.isWhatsAppConfigured).mockReturnValue(true)
})

describe('POST /api/test-whatsapp', () => {
  it('503 si WhatsApp no está configurado', async () => {
    vi.mocked(whatsapp.isWhatsAppConfigured).mockReturnValue(false)

    const res = await post({ to: '8095551234' })

    expect(res.status).toBe(503)
    expect((await readJson<{ code: string }>(res)).code).toBe('NOT_CONFIGURED')
  })

  it('400 si el número de destino no es válido', async () => {
    const res = await post({ to: '123' })

    expect(res.status).toBe(400)
    expect((await readJson<{ code: string }>(res)).code).toBe('BAD_NUMBER')
  })

  it('400 si falta el mensaje en un envío de texto', async () => {
    const res = await post({ to: '8095551234', tipo: 'text' })

    expect(res.status).toBe(400)
    expect((await readJson<{ code: string }>(res)).code).toBe('BAD_REQUEST')
  })

  it('envía texto y devuelve el wamid', async () => {
    vi.mocked(whatsapp.sendWhatsAppTextNow).mockResolvedValueOnce({ ok: true, wamid: 'w1' } as never)

    const res = await post({ to: '8095551234', tipo: 'text', mensaje: 'Hola' })

    expect(res.status).toBe(200)
    expect(await readJson(res)).toMatchObject({ ok: true, to: '+18095551234', tipo: 'text', wamid: 'w1' })
    expect(whatsapp.sendWhatsAppTextNow).toHaveBeenCalledWith({ to: '+18095551234', body: 'Hola' })
  })

  it('502 si el envío de texto falla', async () => {
    vi.mocked(whatsapp.sendWhatsAppTextNow).mockResolvedValueOnce({ ok: false, errorCode: 'E1' } as never)

    const res = await post({ to: '8095551234', tipo: 'text', mensaje: 'Hola' })

    expect(res.status).toBe(502)
    expect((await readJson<{ errorCode: string }>(res)).errorCode).toBe('E1')
  })

  it('usa la plantilla por defecto (hello_world / en_US)', async () => {
    vi.mocked(whatsapp.sendWhatsAppTemplate).mockResolvedValueOnce({ ok: true, wamid: 'w2' } as never)

    const res = await post({ to: '8095551234' })

    expect(res.status).toBe(200)
    expect(await readJson(res)).toMatchObject({ ok: true, template: 'hello_world', wamid: 'w2' })
    expect(whatsapp.sendWhatsAppTemplate).toHaveBeenCalledWith({
      to: '+18095551234',
      name: 'hello_world',
      params: undefined,
      locale: 'en_US',
    })
  })

  it('en producción exige la cabecera x-test-secret', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('CRON_SECRET', 'secreto-cron')

    try {
      const forbidden = await post({ to: '8095551234' })
      expect(forbidden.status).toBe(403)

      vi.mocked(whatsapp.sendWhatsAppTemplate).mockResolvedValueOnce({ ok: true } as never)
      const authorized = await post({ to: '8095551234' }, { 'x-test-secret': 'secreto-cron' })
      expect(authorized.status).toBe(200)
    } finally {
      vi.unstubAllEnvs()
    }
  })
})

describe('GET /api/test-whatsapp', () => {
  it('devuelve el estado y los últimos mensajes/contactos', async () => {
    const res = await route.GET(jsonRequest(URL, 'GET') as unknown as NextRequest)

    expect(res.status).toBe(200)
    expect(await readJson(res)).toMatchObject({ configured: true, messages: [], contacts: [] })
  })
})
