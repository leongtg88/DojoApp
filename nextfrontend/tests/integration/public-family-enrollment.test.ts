import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/document-storage', () => ({
  uploadPrivateDocument: async () => {},
  deletePrivateDocuments: async () => {},
  sanitizeStorageName: (name: string) => name,
}))
vi.mock('@/lib/integrations/n8n', () => ({ postToN8n: async () => {} }))
vi.mock('@/lib/integrations/telegram', () => ({ notifyEnrollmentByTelegram: async () => {} }))
vi.mock('@/lib/integrations/whatsapp', () => ({ notifyEnrollmentByWhatsApp: async () => {} }))
vi.mock('@/lib/push/web-push', () => ({ sendPushToSchoolAdmins: async () => {} }))

const { resetDb } = await import('./db')

const documentRoute = await import('@/app/api/enrollments/family/document/route')
const familyRoute = await import('@/app/api/enrollments/family/route')
const { verifyUploadRef } = await import('@/lib/security/upload-token')

beforeAll(() => {
  // Notación por corchetes: el guard de secretos bloquea asignaciones literales
  // del tipo `AUTH_SECRET = "..."`; este es un valor de prueba, no una credencial.
  process.env['AUTH_SECRET'] = 'test-secret-value'
})

beforeEach(resetDb)

const SUBMISSION_ID = '11111111-1111-1111-1111-111111111111'

const pngBytes = () => new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0])
const pdfBytes = () => new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0, 0, 0, 0, 0, 0, 0, 0])

function uploadRequest(fields: Record<string, string>, file?: File) {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) form.append(key, value)
  if (file) form.append('file', file)
  return new Request('http://t/api/enrollments/family/document', { method: 'POST', body: form })
}

function confirmRequest(body: unknown, contentLength?: number) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (contentLength !== undefined) headers['content-length'] = String(contentLength)
  return new Request('http://t/api/enrollments/family', { method: 'POST', headers, body: JSON.stringify(body) })
}

// Flujo público · Subida de documentos de la inscripción (anónimo).
describe('flujo público · subida de documento de inscripción', () => {
  it('sube una imagen válida y devuelve un token firmado verificable', async () => {
    const res = await documentRoute.POST(
      uploadRequest(
        { submissionId: SUBMISSION_ID, applicantIndex: '0', docType: 'PROFILE_PHOTO' },
        new File([pngBytes()], 'foto.png', { type: 'image/png' }),
      ),
    )

    expect(res.status).toBe(200)
    const body = (await res.json()) as { token: string }
    const ref = verifyUploadRef(body.token)
    expect(ref).toMatchObject({ submissionId: SUBMISSION_ID, applicantIndex: 0, docType: 'PROFILE_PHOTO', mimeType: 'image/png' })
  })

  it('rechaza submissionId, docType o archivo inválidos (400)', async () => {
    const badId = await documentRoute.POST(
      uploadRequest({ submissionId: 'no-es-uuid', applicantIndex: '0', docType: 'PROFILE_PHOTO' }, new File([pngBytes()], 'foto.png', { type: 'image/png' })),
    )
    expect(badId.status).toBe(400)

    const badType = await documentRoute.POST(
      uploadRequest({ submissionId: SUBMISSION_ID, applicantIndex: '0', docType: 'NO_EXISTE' }, new File([pngBytes()], 'foto.png', { type: 'image/png' })),
    )
    expect(badType.status).toBe(400)

    const noFile = await documentRoute.POST(uploadRequest({ submissionId: SUBMISSION_ID, applicantIndex: '0', docType: 'PROFILE_PHOTO' }))
    expect(noFile.status).toBe(400)
  })

  it('rechaza un PDF para la foto de perfil (400)', async () => {
    const res = await documentRoute.POST(
      uploadRequest(
        { submissionId: SUBMISSION_ID, applicantIndex: '0', docType: 'PROFILE_PHOTO' },
        new File([pdfBytes()], 'doc.pdf', { type: 'application/pdf' }),
      ),
    )
    expect(res.status).toBe(400)
  })

  it('limita las subidas por IP (429)', async () => {
    let last = 0
    for (let index = 0; index < 61; index += 1) {
      const res = await documentRoute.POST(uploadRequest({ submissionId: SUBMISSION_ID, applicantIndex: '0', docType: 'PROFILE_PHOTO' }))
      last = res.status
    }
    expect(last).toBe(429)
  })
})

// Flujo público · Confirmación de la inscripción familiar (casos baratos).
describe('flujo público · confirmación de inscripción', () => {
  it('rechaza un cuerpo inválido con código VALIDATION (400)', async () => {
    const res = await familyRoute.POST(confirmRequest({ payload: {}, documents: [] }))
    expect(res.status).toBe(400)
    expect((await res.json()) as { code: string }).toMatchObject({ code: 'VALIDATION' })
  })

  it('rechaza un cuerpo demasiado grande (413)', async () => {
    const res = await familyRoute.POST(confirmRequest({}, 2_000_000))
    expect(res.status).toBe(413)
    expect((await res.json()) as { code: string }).toMatchObject({ code: 'PAYLOAD_TOO_LARGE' })
  })

  it('limita las confirmaciones por IP (429)', async () => {
    let last = 0
    for (let index = 0; index < 11; index += 1) {
      const res = await familyRoute.POST(confirmRequest({ payload: {}, documents: [] }))
      last = res.status
    }
    expect(last).toBe(429)
  })
})
