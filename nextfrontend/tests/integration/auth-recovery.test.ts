import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'

const { db, resetDb } = await import('./db')
const { createUser } = await import('./fixtures')

const forgotRoute = await import('@/app/api/auth/forgot-password/route')
const resetRoute = await import('@/app/api/auth/reset-password/route')
const verifyRoute = await import('@/app/api/auth/verify-email/route')
const { createHash } = await import('node:crypto')
const bcrypt = (await import('bcryptjs')).default

const hash = (token: string) => createHash('sha256').update(token).digest('hex')

function jsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
}

beforeAll(() => {
  // Fuerza el camino "sin correo configurado" (no llama a Resend).
  delete process.env.RESEND_API_KEY
  delete process.env.EMAIL_FROM
})

beforeEach(resetDb)

// Flujo público · Recuperación de contraseña y verificación de correo.
describe('auth · recuperación de contraseña', () => {
  it('no revela si el correo existe y no crea token para desconocidos', async () => {
    const res = await forgotRoute.POST(jsonRequest('http://t/api/auth/forgot-password', { email: 'nadie@test.dev' }))
    expect(res.status).toBe(200)
    expect(await db.passwordResetToken.count()).toBe(0)
  })

  it('crea un token para una cuenta existente (respuesta genérica)', async () => {
    const user = await createUser({ email: 'ana@test.dev', roles: ['STUDENT'] })

    const res = await forgotRoute.POST(jsonRequest('http://t/api/auth/forgot-password', { email: 'ana@test.dev' }))

    expect(res.status).toBe(200)
    const tokens = await db.passwordResetToken.findMany({ where: { userId: user.id } })
    expect(tokens).toHaveLength(1)
    expect(tokens[0].usedAt).toBeNull()
  })

  it('rechaza un correo inválido (400) y limita los intentos por correo (429)', async () => {
    const invalid = await forgotRoute.POST(jsonRequest('http://t/api/auth/forgot-password', { email: 'no-es-email' }))
    expect(invalid.status).toBe(400)

    let last = 0
    for (let index = 0; index < 6; index += 1) {
      const res = await forgotRoute.POST(jsonRequest('http://t/api/auth/forgot-password', { email: 'ana@test.dev' }))
      last = res.status
    }
    expect(last).toBe(429)
  })
})

describe('auth · restablecer contraseña', () => {
  it('rechaza token inexistente o expirado (400)', async () => {
    const notFound = await resetRoute.POST(jsonRequest('http://t/api/auth/reset-password', { token: 'inexistente', password: 'Password123' }))
    expect(notFound.status).toBe(400)

    const user = await createUser({ email: 'exp@test.dev', roles: ['STUDENT'] })
    await db.passwordResetToken.create({ data: { token: hash('expirado'), userId: user.id, expiresAt: new Date(Date.now() - 1000) } })
    const expired = await resetRoute.POST(jsonRequest('http://t/api/auth/reset-password', { token: 'expirado', password: 'Password123' }))
    expect(expired.status).toBe(400)
  })

  it('actualiza la contraseña, invalida sesiones y consume el token', async () => {
    const user = await createUser({ email: 'ana@test.dev', roles: ['STUDENT'] })
    await db.passwordResetToken.create({ data: { token: hash('valido'), userId: user.id, expiresAt: new Date(Date.now() + 60_000) } })

    const res = await resetRoute.POST(jsonRequest('http://t/api/auth/reset-password', { token: 'valido', password: 'NuevaClave123' }))

    expect(res.status).toBe(200)
    const updated = await db.user.findUniqueOrThrow({ where: { id: user.id } })
    expect(updated.sessionVersion).toBe(1)
    expect(await bcrypt.compare('NuevaClave123', updated.passwordHash ?? '')).toBe(true)
    const token = await db.passwordResetToken.findFirstOrThrow({ where: { userId: user.id } })
    expect(token.usedAt).not.toBeNull()
  })
})

describe('auth · verificar correo', () => {
  it('rechaza sin token (400) y con token inválido/expirado (400)', async () => {
    const noToken = await verifyRoute.POST(new NextRequest('http://t/api/auth/verify-email'))
    expect(noToken.status).toBe(400)

    const user = await createUser({ email: 'v@test.dev', roles: ['STUDENT'] })
    await db.emailVerificationToken.create({ data: { token: hash('expirado'), userId: user.id, expiresAt: new Date(Date.now() - 1000) } })
    const expired = await verifyRoute.POST(new NextRequest('http://t/api/auth/verify-email?token=expirado'))
    expect(expired.status).toBe(400)
  })

  it('marca el correo como verificado y consume el token', async () => {
    const user = await createUser({ email: 'v@test.dev', roles: ['STUDENT'] })
    await db.user.update({ where: { id: user.id }, data: { emailVerified: null } })
    await db.emailVerificationToken.create({ data: { token: hash('valido'), userId: user.id, expiresAt: new Date(Date.now() + 60_000) } })

    const res = await verifyRoute.POST(new NextRequest('http://t/api/auth/verify-email?token=valido'))

    expect(res.status).toBe(200)
    expect((await db.user.findUniqueOrThrow({ where: { id: user.id } })).emailVerified).not.toBeNull()
    expect((await db.emailVerificationToken.findFirstOrThrow({ where: { userId: user.id } })).usedAt).not.toBeNull()
  })
})
