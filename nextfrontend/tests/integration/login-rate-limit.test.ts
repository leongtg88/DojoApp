import { beforeEach, describe, expect, it } from 'vitest'

const { resetDb } = await import('./db')
const { consumeRateLimit, peekRateLimit, resetRateLimit } = await import('@/lib/security/rate-limit')

// Política de login (auth.ts): 60 intentos por IP/15min y lockout de 5 fallos por correo/15min.
const IP_POLICY = { limit: 60, windowMs: 15 * 60 * 1000 }
const EMAIL_POLICY = { limit: 5, windowMs: 15 * 60 * 1000 }

beforeEach(resetDb)

describe('política de rate-limit del login', () => {
  it('bloquea tras 5 fallos consecutivos del mismo correo', async () => {
    const email = 'alumno@test.dev'
    for (let index = 0; index < 5; index += 1) {
      await consumeRateLimit(`login-fail:${email}`, EMAIL_POLICY)
    }

    expect((await peekRateLimit(`login-fail:${email}`, EMAIL_POLICY)).allowed).toBe(false)
  })

  it('un login exitoso (reset) libera el bloqueo del correo', async () => {
    const email = 'alumno@test.dev'
    for (let index = 0; index < 5; index += 1) {
      await consumeRateLimit(`login-fail:${email}`, EMAIL_POLICY)
    }

    await resetRateLimit(`login-fail:${email}`)

    expect((await peekRateLimit(`login-fail:${email}`, EMAIL_POLICY)).allowed).toBe(true)
  })

  it('aplica el tope por IP a los 60 intentos', async () => {
    const ip = '203.0.113.7'
    for (let index = 0; index < 60; index += 1) {
      await consumeRateLimit(`login:${ip}`, IP_POLICY)
    }

    expect((await consumeRateLimit(`login:${ip}`, IP_POLICY)).allowed).toBe(false)
  })

  it('no bloquea a otro correo distinto', async () => {
    await consumeRateLimit('login-fail:uno@test.dev', EMAIL_POLICY)
    await consumeRateLimit('login-fail:uno@test.dev', EMAIL_POLICY)

    expect((await peekRateLimit('login-fail:dos@test.dev', EMAIL_POLICY)).allowed).toBe(true)
  })
})
