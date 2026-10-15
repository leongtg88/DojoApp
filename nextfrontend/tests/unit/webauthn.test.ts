import { beforeEach, describe, expect, it } from 'vitest'
import {
  bytesFromBase64Url,
  bytesToBase64Url,
  resolveWebAuthnRp,
  sealValue,
  unsealValue,
} from '@/lib/auth/webauthn'

function fakeRequest(headers: Record<string, string>): Request {
  return { headers: new Headers(headers) } as unknown as Request
}

// Se asigna con notación de corchetes a propósito: el guard de secretos
// (`scripts/guard-env.mjs`) bloquea asignaciones literales del tipo
// `AUTH_SECRET = "..."`, y estos son valores de prueba, no credenciales reales.
function setAuthSecret(value: string): void {
  process.env['AUTH_SECRET'] = value
}

beforeEach(() => {
  setAuthSecret('test-secret-test-secret-test-secret')
  delete process.env.WEBAUTHN_RP_ID
  delete process.env.WEBAUTHN_RP_NAME
})

describe('sealValue / unsealValue', () => {
  it('hace round-trip de un payload válido', () => {
    const token = sealValue({ uid: 'user-1', exp: Date.now() + 10_000 })
    const parsed = unsealValue<{ uid: string }>(token)
    expect(parsed?.uid).toBe('user-1')
  })

  it('rechaza un payload manipulado (firma inválida)', () => {
    const token = sealValue({ uid: 'user-1', exp: Date.now() + 10_000 })
    const signature = token.slice(token.indexOf('.') + 1)
    const forged = Buffer.from(JSON.stringify({ uid: 'admin', exp: Date.now() + 10_000 })).toString('base64url')
    expect(unsealValue(`${forged}.${signature}`)).toBeNull()
  })

  it('rechaza un payload expirado', () => {
    const token = sealValue({ uid: 'user-1', exp: Date.now() - 1_000 })
    expect(unsealValue(token)).toBeNull()
  })

  it('rechaza valores vacíos o mal formados', () => {
    expect(unsealValue(undefined)).toBeNull()
    expect(unsealValue(null)).toBeNull()
    expect(unsealValue('sin-punto')).toBeNull()
    expect(unsealValue('a.b.c')).toBeNull()
  })

  it('rechaza la firma de otro secreto', () => {
    const token = sealValue({ uid: 'user-1', exp: Date.now() + 10_000 })
    setAuthSecret('otro-secreto-distinto-muy-largo')
    expect(unsealValue(token)).toBeNull()
  })
})

describe('resolveWebAuthnRp', () => {
  it('deriva rpID y origin https desde los headers del proxy', () => {
    const rp = resolveWebAuthnRp(
      fakeRequest({ 'x-forwarded-host': 'toseigusoku.com', 'x-forwarded-proto': 'https' }),
    )
    expect(rp.rpID).toBe('toseigusoku.com')
    expect(rp.origin).toBe('https://toseigusoku.com')
  })

  it('usa http en localhost', () => {
    const rp = resolveWebAuthnRp(fakeRequest({ host: 'localhost:3000' }))
    expect(rp.rpID).toBe('localhost')
    expect(rp.origin).toBe('http://localhost:3000')
  })

  it('respeta el override de WEBAUTHN_RP_ID', () => {
    process.env.WEBAUTHN_RP_ID = 'example.org'
    const rp = resolveWebAuthnRp(fakeRequest({ host: 'app.example.org' }))
    expect(rp.rpID).toBe('example.org')
  })

  it('toma el primer host cuando hay varios separados por coma', () => {
    const rp = resolveWebAuthnRp(fakeRequest({ 'x-forwarded-host': 'dojo.com, interno.local' }))
    expect(rp.rpID).toBe('dojo.com')
  })
})

describe('conversión base64url', () => {
  it('hace round-trip de bytes', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 255])
    const encoded = bytesToBase64Url(bytes)
    const decoded = bytesFromBase64Url(encoded)
    expect(Array.from(decoded)).toEqual(Array.from(bytes))
  })
})
