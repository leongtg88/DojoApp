import { createHmac } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { isN8nConfigured, postToN8n } from '@/lib/integrations/n8n'

type FetchArgs = [string, { method: string; redirect: string; body: string; headers: Record<string, string> }]

const originalFetch = globalThis.fetch
const originalUrl = process.env.N8N_WEBHOOK_URL
const originalSecret = process.env.N8N_WEBHOOK_SECRET

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}

afterEach(() => {
  globalThis.fetch = originalFetch
  restoreEnv('N8N_WEBHOOK_URL', originalUrl)
  restoreEnv('N8N_WEBHOOK_SECRET', originalSecret)
  vi.restoreAllMocks()
})

describe('integración n8n', () => {
  it('isN8nConfigured refleja N8N_WEBHOOK_URL', () => {
    delete process.env['N8N_WEBHOOK_URL']
    expect(isN8nConfigured()).toBe(false)

    process.env['N8N_WEBHOOK_URL'] = 'https://n8n.test/webhook'
    expect(isN8nConfigured()).toBe(true)
  })

  it('no hace fetch si no hay webhook configurado', async () => {
    delete process.env['N8N_WEBHOOK_URL']
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy as unknown as typeof fetch

    await postToN8n('enrollment.created', { a: 1 })

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('envía el sobre firmado con HMAC-SHA256', async () => {
    process.env['N8N_WEBHOOK_URL'] = 'https://n8n.test/webhook'
    process.env['N8N_WEBHOOK_SECRET'] = 'secreto-de-prueba'
    const fetchSpy = vi.fn(async () => new Response('ok'))
    globalThis.fetch = fetchSpy as unknown as typeof fetch

    await postToN8n('student.converted', { studentId: 's1' })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = (fetchSpy.mock.calls as unknown as FetchArgs[])[0]
    expect(url).toBe('https://n8n.test/webhook')
    expect(init.method).toBe('POST')
    expect(init.redirect).toBe('error')

    const envelope = JSON.parse(init.body) as { source: string; event: string; timestamp: string; data: unknown }
    expect(envelope).toMatchObject({ source: 'dojoapp', event: 'student.converted', data: { studentId: 's1' } })
    expect(typeof envelope.timestamp).toBe('string')

    const expected = createHmac('sha256', 'secreto-de-prueba').update(init.body).digest('hex')
    expect(init.headers['x-dojoapp-signature']).toBe(expected)
  })

  it('envía sin firma cuando no hay secreto', async () => {
    process.env['N8N_WEBHOOK_URL'] = 'https://n8n.test/webhook'
    delete process.env['N8N_WEBHOOK_SECRET']
    const fetchSpy = vi.fn(async () => new Response('ok'))
    globalThis.fetch = fetchSpy as unknown as typeof fetch

    await postToN8n('enrollment.created', {})

    const init = (fetchSpy.mock.calls as unknown as FetchArgs[])[0][1]
    expect(init.headers['x-dojoapp-signature']).toBeUndefined()
  })

  it('no propaga errores si el envío falla', async () => {
    process.env['N8N_WEBHOOK_URL'] = 'https://n8n.test/webhook'
    globalThis.fetch = vi.fn(async () => {
      throw new Error('sin red')
    }) as unknown as typeof fetch
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(postToN8n('enrollment.created', {})).resolves.toBeUndefined()

    expect(errorSpy).toHaveBeenCalled()
  })
})
