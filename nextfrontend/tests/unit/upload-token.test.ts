import { createHmac } from 'node:crypto'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { signUploadRef, verifyUploadRef, type UploadRef } from '@/lib/security/upload-token'

// El módulo firma con AUTH_SECRET (o UPLOAD_TOKEN_SECRET). Se fija un valor de
// prueba; la lectura del secreto es perezosa, así que basta con definirlo antes
// de firmar.
const SECRET = 'test-secret-value'

const ref: UploadRef = {
  submissionId: '11111111-1111-1111-1111-111111111111',
  storageKey: 'enrollments/pending/abc-0-PROFILE_PHOTO-uuid-foto.jpg',
  applicantIndex: 0,
  docType: 'PROFILE_PHOTO',
  fileName: 'foto.jpg',
  mimeType: 'image/jpeg',
  fileSize: 12345,
}

beforeAll(() => {
  process.env.AUTH_SECRET = SECRET
})

afterEach(() => {
  vi.useRealTimers()
})

describe('upload-token', () => {
  it('firma y verifica una referencia', () => {
    expect(verifyUploadRef(signUploadRef(ref))).toEqual(ref)
  })

  it('rechaza un token cuya carga se manipuló', () => {
    const signature = signUploadRef(ref).split('.')[1]
    const tampered = Buffer.from(
      JSON.stringify({ ...ref, storageKey: 'enrollments/pending/otra-ruta.jpg', exp: Date.now() + 60_000 }),
      'utf8',
    ).toString('base64url')
    expect(verifyUploadRef(`${tampered}.${signature}`)).toBeNull()
  })

  it('rechaza un token expirado', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const token = signUploadRef(ref)
    vi.setSystemTime(new Date('2026-01-01T02:00:00Z'))
    expect(verifyUploadRef(token)).toBeNull()
  })

  it('rechaza un token con firma válida pero tipo de documento desconocido', () => {
    const payload = JSON.stringify({ ...ref, docType: 'HACK', exp: Date.now() + 60_000 })
    const body = Buffer.from(payload, 'utf8').toString('base64url')
    const signature = createHmac('sha256', SECRET).update(body).digest('base64url')
    expect(verifyUploadRef(`${body}.${signature}`)).toBeNull()
  })

  it('rechaza valores no válidos sin lanzar', () => {
    expect(verifyUploadRef(null)).toBeNull()
    expect(verifyUploadRef(undefined)).toBeNull()
    expect(verifyUploadRef('sin-punto')).toBeNull()
    expect(verifyUploadRef('carga.firma')).toBeNull()
  })
})
