import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/auth', async () => {
  const mod = await import('./route-auth')
  return { auth: mod.authMock.auth }
})

// Las funciones de cookie usan `cookies()` de `next/headers`, que fuera de una
// petición real lanza. Se sustituyen por dobles; el resto (firma, base64url,
// resolución del RP) se usa real.
vi.mock('@/lib/auth/webauthn', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth/webauthn')>()
  return {
    ...actual,
    setChallengeCookie: vi.fn(async () => {}),
    clearChallengeCookie: vi.fn(async () => {}),
    setLoginTicketCookie: vi.fn(async () => {}),
    readChallengeCookie: vi.fn(async () => null),
  }
})

// Verificación de aserciones/atestaciones: determinista, sin criptografía real.
vi.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: vi.fn(async () => ({ challenge: 'challenge-register' })),
  generateAuthenticationOptions: vi.fn(async () => ({ challenge: 'challenge-login' })),
  verifyRegistrationResponse: vi.fn(),
  verifyAuthenticationResponse: vi.fn(),
}))

import type { NextRequest } from 'next/server'

const { db, resetDb } = await import('./db')
const { authMock } = await import('./route-auth')
const { jsonRequest, routeParams, readJson } = await import('./http')
const { createUser } = await import('./fixtures')
const webauthn = await import('@/lib/auth/webauthn')
const simplewebauthn = await import('@simplewebauthn/server')

const registerOptionsRoute = await import('@/app/api/auth/webauthn/register/options/route')
const registerVerifyRoute = await import('@/app/api/auth/webauthn/register/verify/route')
const loginOptionsRoute = await import('@/app/api/auth/webauthn/login/options/route')
const loginVerifyRoute = await import('@/app/api/auth/webauthn/login/verify/route')
const credentialsRoute = await import('@/app/api/auth/webauthn/credentials/route')
const credentialRoute = await import('@/app/api/auth/webauthn/credentials/[credentialId]/route')

const IP = '203.0.113.10'

/** Request con IP y host deterministas para el rate-limit y el RP. */
function req(url: string, method: string, body?: unknown): NextRequest {
  const request = jsonRequest(url, method, body)
  request.headers.set('x-forwarded-for', IP)
  request.headers.set('x-forwarded-host', 'dojo.test')
  request.headers.set('x-forwarded-proto', 'https')
  return request as unknown as NextRequest
}

function challengeFor(purpose: 'register' | 'login', userId: string | null) {
  return { challenge: 'desafío-de-prueba', purpose, userId, exp: Date.now() + 60_000 }
}

function verifiedRegistration(id: string) {
  return {
    verified: true,
    registrationInfo: {
      credential: { id, publicKey: new Uint8Array([1, 2, 3]), counter: 0, transports: ['internal'] },
      credentialDeviceType: 'singleDevice',
      credentialBackedUp: false,
    },
  }
}

async function createCredential(userId: string, credentialId = `cred-${randomUUID()}`, deviceName: string | null = null) {
  return db.webAuthnCredential.create({
    data: {
      userId,
      credentialId,
      publicKey: webauthn.bytesToBase64Url(new Uint8Array([1, 2, 3])),
      counter: 0,
      transports: ['internal'],
      deviceName,
    },
    select: { id: true, credentialId: true },
  })
}

async function makeUser(roles: Array<'STUDENT' | 'SCHOOL_ADMIN'> = ['STUDENT'], verified = false) {
  const user = await createUser({ email: `u-${randomUUID()}@test.dev`, roles })
  if (verified) {
    await db.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } })
  }
  return user
}

beforeEach(async () => {
  await resetDb()
  authMock.setUser(null)
  vi.clearAllMocks()
})

// WebAuthn · registro de dispositivos (huella / Face ID).
describe('WebAuthn · register/options', () => {
  it('exige sesión (401)', async () => {
    const res = await registerOptionsRoute.POST(req('http://t/api/auth/webauthn/register/options', 'POST'))
    expect(res.status).toBe(401)
  })

  it('genera las opciones y guarda el desafío ligado al usuario', async () => {
    const user = await makeUser(['STUDENT'])
    authMock.setUser(user.id, { roles: ['STUDENT'] })

    const res = await registerOptionsRoute.POST(req('http://t/api/auth/webauthn/register/options', 'POST'))

    expect(res.status).toBe(200)
    expect(await readJson<{ challenge: string }>(res)).toMatchObject({ challenge: 'challenge-register' })
    expect(webauthn.setChallengeCookie).toHaveBeenCalledWith('challenge-register', 'register', user.id)
  })

  it('401 si el usuario de la sesión ya no existe', async () => {
    authMock.setUser('usuario-inexistente', { roles: ['STUDENT'] })

    const res = await registerOptionsRoute.POST(req('http://t/api/auth/webauthn/register/options', 'POST'))

    expect(res.status).toBe(401)
  })
})

describe('WebAuthn · register/verify', () => {
  it('exige sesión (401)', async () => {
    const res = await registerVerifyRoute.POST(req('http://t/api/auth/webauthn/register/verify', 'POST', { response: { id: 'x' } }))
    expect(res.status).toBe(401)
  })

  it('rechaza un cuerpo inválido (400)', async () => {
    const user = await makeUser(['STUDENT'])
    authMock.setUser(user.id, { roles: ['STUDENT'] })

    const res = await registerVerifyRoute.POST(req('http://t/api/auth/webauthn/register/verify', 'POST', {}))

    expect(res.status).toBe(400)
  })

  it('rechaza si el desafío no corresponde (400)', async () => {
    const user = await makeUser(['STUDENT'])
    authMock.setUser(user.id, { roles: ['STUDENT'] })
    const url = 'http://t/api/auth/webauthn/register/verify'

    vi.mocked(webauthn.readChallengeCookie).mockResolvedValueOnce(null)
    expect((await registerVerifyRoute.POST(req(url, 'POST', { response: { id: 'x' } }))).status).toBe(400)

    vi.mocked(webauthn.readChallengeCookie).mockResolvedValueOnce(challengeFor('login', user.id))
    expect((await registerVerifyRoute.POST(req(url, 'POST', { response: { id: 'x' } }))).status).toBe(400)

    vi.mocked(webauthn.readChallengeCookie).mockResolvedValueOnce(challengeFor('register', 'otro-usuario'))
    expect((await registerVerifyRoute.POST(req(url, 'POST', { response: { id: 'x' } }))).status).toBe(400)
  })

  it('400 si la verificación del atestado falla o no es válida', async () => {
    const user = await makeUser(['STUDENT'])
    authMock.setUser(user.id, { roles: ['STUDENT'] })
    const url = 'http://t/api/auth/webauthn/register/verify'

    vi.mocked(webauthn.readChallengeCookie).mockResolvedValueOnce(challengeFor('register', user.id))
    vi.mocked(simplewebauthn.verifyRegistrationResponse).mockRejectedValueOnce(new Error('boom'))
    expect((await registerVerifyRoute.POST(req(url, 'POST', { response: { id: 'x' } }))).status).toBe(400)

    vi.mocked(webauthn.readChallengeCookie).mockResolvedValueOnce(challengeFor('register', user.id))
    vi.mocked(simplewebauthn.verifyRegistrationResponse).mockResolvedValueOnce({ verified: false } as never)
    expect((await registerVerifyRoute.POST(req(url, 'POST', { response: { id: 'x' } }))).status).toBe(400)
  })

  it('409 si el dispositivo ya está registrado', async () => {
    const user = await makeUser(['STUDENT'])
    authMock.setUser(user.id, { roles: ['STUDENT'] })
    await createCredential(user.id, 'cred-dup')

    vi.mocked(webauthn.readChallengeCookie).mockResolvedValueOnce(challengeFor('register', user.id))
    vi.mocked(simplewebauthn.verifyRegistrationResponse).mockResolvedValueOnce(verifiedRegistration('cred-dup') as never)

    const res = await registerVerifyRoute.POST(req('http://t/api/auth/webauthn/register/verify', 'POST', { response: { id: 'cred-dup' } }))

    expect(res.status).toBe(409)
  })

  it('registra el dispositivo (200), lo persiste y audita', async () => {
    const user = await makeUser(['STUDENT'])
    authMock.setUser(user.id, { roles: ['STUDENT'] })

    vi.mocked(webauthn.readChallengeCookie).mockResolvedValueOnce(challengeFor('register', user.id))
    vi.mocked(simplewebauthn.verifyRegistrationResponse).mockResolvedValueOnce(verifiedRegistration('cred-new') as never)

    const res = await registerVerifyRoute.POST(
      req('http://t/api/auth/webauthn/register/verify', 'POST', { response: { id: 'cred-new' }, deviceName: 'Mi teléfono' }),
    )

    expect(res.status).toBe(200)
    expect(await readJson(res)).toMatchObject({ verified: true, credentialId: 'cred-new' })

    const row = await db.webAuthnCredential.findUniqueOrThrow({ where: { credentialId: 'cred-new' } })
    expect(row.userId).toBe(user.id)
    expect(row.deviceName).toBe('Mi teléfono')
    expect(row.deviceType).toBe('singleDevice')
    expect(row.publicKey).toBe(webauthn.bytesToBase64Url(new Uint8Array([1, 2, 3])))
    expect(webauthn.clearChallengeCookie).toHaveBeenCalled()
    expect(await db.auditLog.count({ where: { action: 'webauthn.register' } })).toBe(1)
  })
})

// WebAuthn · ingreso sin contraseña (passkeys).
describe('WebAuthn · login/options', () => {
  it('genera las opciones y guarda el desafío de login', async () => {
    const res = await loginOptionsRoute.POST(req('http://t/api/auth/webauthn/login/options', 'POST'))

    expect(res.status).toBe(200)
    expect(await readJson<{ challenge: string }>(res)).toMatchObject({ challenge: 'challenge-login' })
    expect(webauthn.setChallengeCookie).toHaveBeenCalledWith('challenge-login', 'login', null)
  })
})

describe('WebAuthn · login/verify', () => {
  const url = 'http://t/api/auth/webauthn/login/verify'

  it('rechaza un cuerpo inválido (400)', async () => {
    const res = await loginVerifyRoute.POST(req(url, 'POST', {}))
    expect(res.status).toBe(400)
  })

  it('404 si la credencial no está registrada', async () => {
    const res = await loginVerifyRoute.POST(req(url, 'POST', { response: { id: 'no-existe' } }))
    expect(res.status).toBe(404)
  })

  it('400 si el desafío expiró', async () => {
    const user = await makeUser(['SCHOOL_ADMIN'], true)
    const credential = await createCredential(user.id)

    vi.mocked(webauthn.readChallengeCookie).mockResolvedValueOnce(null)

    const res = await loginVerifyRoute.POST(req(url, 'POST', { response: { id: credential.credentialId } }))

    expect(res.status).toBe(400)
  })

  it('400 si la verificación de la aserción falla o no es válida', async () => {
    const user = await makeUser(['SCHOOL_ADMIN'], true)
    const credential = await createCredential(user.id)

    vi.mocked(webauthn.readChallengeCookie).mockResolvedValueOnce(challengeFor('login', null))
    vi.mocked(simplewebauthn.verifyAuthenticationResponse).mockRejectedValueOnce(new Error('boom'))
    expect((await loginVerifyRoute.POST(req(url, 'POST', { response: { id: credential.credentialId } }))).status).toBe(400)

    vi.mocked(webauthn.readChallengeCookie).mockResolvedValueOnce(challengeFor('login', null))
    vi.mocked(simplewebauthn.verifyAuthenticationResponse).mockResolvedValueOnce({ verified: false } as never)
    expect((await loginVerifyRoute.POST(req(url, 'POST', { response: { id: credential.credentialId } }))).status).toBe(400)
  })

  it('403 si el correo no está verificado', async () => {
    const user = await makeUser(['SCHOOL_ADMIN'], false)
    const credential = await createCredential(user.id)

    vi.mocked(webauthn.readChallengeCookie).mockResolvedValueOnce(challengeFor('login', null))
    vi.mocked(simplewebauthn.verifyAuthenticationResponse).mockResolvedValueOnce({
      verified: true,
      authenticationInfo: { newCounter: 1 },
    } as never)

    const res = await loginVerifyRoute.POST(req(url, 'POST', { response: { id: credential.credentialId } }))

    expect(res.status).toBe(403)
  })

  it('403 si el alumno no tiene expediente (gate de acceso)', async () => {
    const user = await makeUser(['STUDENT'], true)
    const credential = await createCredential(user.id)

    vi.mocked(webauthn.readChallengeCookie).mockResolvedValueOnce(challengeFor('login', null))
    vi.mocked(simplewebauthn.verifyAuthenticationResponse).mockResolvedValueOnce({
      verified: true,
      authenticationInfo: { newCounter: 1 },
    } as never)

    const res = await loginVerifyRoute.POST(req(url, 'POST', { response: { id: credential.credentialId } }))

    expect(res.status).toBe(403)
  })

  it('200 con acceso: actualiza el contador, audita y deja el ticket', async () => {
    const user = await makeUser(['SCHOOL_ADMIN'], true)
    const credential = await createCredential(user.id)

    vi.mocked(webauthn.readChallengeCookie).mockResolvedValueOnce(challengeFor('login', null))
    vi.mocked(simplewebauthn.verifyAuthenticationResponse).mockResolvedValueOnce({
      verified: true,
      authenticationInfo: { newCounter: 5 },
    } as never)

    const res = await loginVerifyRoute.POST(req(url, 'POST', { response: { id: credential.credentialId } }))

    expect(res.status).toBe(200)
    expect(await readJson(res)).toMatchObject({ verified: true })

    const row = await db.webAuthnCredential.findUniqueOrThrow({ where: { id: credential.id } })
    expect(row.counter).toBe(5)
    expect(row.lastUsedAt).not.toBeNull()
    expect(await db.auditLog.count({ where: { action: 'webauthn.login' } })).toBe(1)
    expect(webauthn.setLoginTicketCookie).toHaveBeenCalledWith(user.id, 0)
  })

  it('limita los intentos por IP (429 al superar 40)', async () => {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      await loginVerifyRoute.POST(req(url, 'POST', {}))
    }

    const res = await loginVerifyRoute.POST(req(url, 'POST', {}))

    expect(res.status).toBe(429)
  })
})

// WebAuthn · gestión de dispositivos del usuario actual.
describe('WebAuthn · credenciales', () => {
  it('exige sesión (401) al listar, renombrar y eliminar', async () => {
    authMock.setUser(null)

    expect((await credentialsRoute.GET()).status).toBe(401)
    expect((await credentialRoute.PATCH(req('http://t/x', 'PATCH', { deviceName: 'x' }), routeParams({ credentialId: 'c' }))).status).toBe(401)
    expect((await credentialRoute.DELETE(req('http://t/x', 'DELETE'), routeParams({ credentialId: 'c' }))).status).toBe(401)
  })

  it('lista solo las credenciales del usuario actual', async () => {
    const me = await makeUser(['SCHOOL_ADMIN'])
    const other = await makeUser(['SCHOOL_ADMIN'])
    await createCredential(me.id, 'mia', 'Mi huella')
    await createCredential(other.id, 'ajena', 'Otra huella')
    authMock.setUser(me.id, { roles: ['SCHOOL_ADMIN'] })

    const res = await credentialsRoute.GET()
    const body = await readJson<{ credentials: Array<{ deviceName: string | null }> }>(res)

    expect(res.status).toBe(200)
    expect(body.credentials).toHaveLength(1)
    expect(body.credentials[0].deviceName).toBe('Mi huella')
  })

  it('PATCH rechaza un nombre inválido (400)', async () => {
    const me = await makeUser(['SCHOOL_ADMIN'])
    const credential = await createCredential(me.id)
    authMock.setUser(me.id, { roles: ['SCHOOL_ADMIN'] })

    const res = await credentialRoute.PATCH(req('http://t/x', 'PATCH', { deviceName: '   ' }), routeParams({ credentialId: credential.id }))

    expect(res.status).toBe(400)
  })

  it('PATCH 404 si la credencial es de otro usuario', async () => {
    const me = await makeUser(['SCHOOL_ADMIN'])
    const other = await makeUser(['SCHOOL_ADMIN'])
    const credential = await createCredential(other.id)
    authMock.setUser(me.id, { roles: ['SCHOOL_ADMIN'] })

    const res = await credentialRoute.PATCH(req('http://t/x', 'PATCH', { deviceName: 'Renombrada' }), routeParams({ credentialId: credential.id }))

    expect(res.status).toBe(404)
  })

  it('PATCH renombra la credencial propia (200)', async () => {
    const me = await makeUser(['SCHOOL_ADMIN'])
    const credential = await createCredential(me.id, undefined, 'Vieja')
    authMock.setUser(me.id, { roles: ['SCHOOL_ADMIN'] })

    const res = await credentialRoute.PATCH(req('http://t/x', 'PATCH', { deviceName: 'Nueva' }), routeParams({ credentialId: credential.id }))

    expect(res.status).toBe(200)
    expect((await db.webAuthnCredential.findUniqueOrThrow({ where: { id: credential.id } })).deviceName).toBe('Nueva')
  })

  it('DELETE 404 si la credencial es de otro usuario', async () => {
    const me = await makeUser(['SCHOOL_ADMIN'])
    const other = await makeUser(['SCHOOL_ADMIN'])
    const credential = await createCredential(other.id)
    authMock.setUser(me.id, { roles: ['SCHOOL_ADMIN'] })

    const res = await credentialRoute.DELETE(req('http://t/x', 'DELETE'), routeParams({ credentialId: credential.id }))

    expect(res.status).toBe(404)
    expect(await db.webAuthnCredential.count()).toBe(1)
  })

  it('DELETE elimina la credencial propia (200) y audita', async () => {
    const me = await makeUser(['SCHOOL_ADMIN'])
    const credential = await createCredential(me.id)
    authMock.setUser(me.id, { roles: ['SCHOOL_ADMIN'] })

    const res = await credentialRoute.DELETE(req('http://t/x', 'DELETE'), routeParams({ credentialId: credential.id }))

    expect(res.status).toBe(200)
    expect(await db.webAuthnCredential.count()).toBe(0)
    expect(await db.auditLog.count({ where: { action: 'webauthn.delete' } })).toBe(1)
  })
})
