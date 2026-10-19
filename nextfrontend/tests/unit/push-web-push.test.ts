import { describe, expect, it, vi } from 'vitest'

// `web-push` importa `db`; no se usa en estas guardas.
vi.mock('@/lib/db', () => ({ db: {} }))

import { isPushConfigured, sendPushToSchoolAdmins, sendPushToUsers } from '@/lib/push/web-push'

const PAYLOAD = { title: 'Nuevo grado', body: '¡Felicidades!' }

describe('web-push (guardas)', () => {
  it('sin claves VAPID no está configurado y los envíos son no-op', async () => {
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    delete process.env.VAPID_PRIVATE_KEY
    delete process.env.VAPID_SUBJECT

    expect(isPushConfigured()).toBe(false)
    await expect(sendPushToUsers(['u1'], PAYLOAD)).resolves.toBeUndefined()
    await expect(sendPushToSchoolAdmins('s1', PAYLOAD)).resolves.toBeUndefined()
  })

  it('sin schoolId no intenta enviar a administradores', async () => {
    await expect(sendPushToSchoolAdmins(null, PAYLOAD)).resolves.toBeUndefined()
  })

  it('detecta la configuración cuando están las tres claves', () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'clave-publica'
    process.env.VAPID_PRIVATE_KEY = 'clave-privada'
    process.env.VAPID_SUBJECT = 'mailto:dojo@test.dev'

    expect(isPushConfigured()).toBe(true)

    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    delete process.env.VAPID_PRIVATE_KEY
    delete process.env.VAPID_SUBJECT
  })
})
