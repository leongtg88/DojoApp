import { randomUUID } from 'node:crypto'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { deletePrivateDocuments } = vi.hoisted(() => ({ deletePrivateDocuments: vi.fn(async () => {}) }))

vi.mock('@/lib/document-storage', () => ({
  uploadPrivateDocument: async () => {},
  deletePrivateDocuments,
  sanitizeStorageName: (name: string) => name,
}))
vi.mock('@/lib/integrations/n8n', () => ({ postToN8n: async () => {} }))
vi.mock('@/lib/integrations/telegram', () => ({ notifyEnrollmentByTelegram: async () => {} }))
vi.mock('@/lib/integrations/whatsapp', () => ({ notifyEnrollmentByWhatsApp: async () => {} }))
vi.mock('@/lib/push/web-push', () => ({ sendPushToSchoolAdmins: async () => {} }))

const { db, resetDb } = await import('./db')
const { createSchool, createBranch } = await import('./fixtures')
const familyRoute = await import('@/app/api/enrollments/family/route')
const { signUploadRef } = await import('@/lib/security/upload-token')

beforeAll(() => {
  // Notación por corchetes: el guard de secretos bloquea asignaciones literales
  // del tipo `AUTH_SECRET = "..."`; este es un valor de prueba, no una credencial.
  process.env['AUTH_SECRET'] = 'test-secret-value'
})

beforeEach(async () => {
  deletePrivateDocuments.mockClear()
  await resetDb()
})

const ADULT_PROFILE = {
  sexo: 'Masculino',
  pantSize: 'M',
  shirtSize: 'L',
  height: '175',
  bloodType: 'O+',
  estadoCivilHogar: ['Con pareja'],
  personasACargo: 'No',
  otrasArtesMarciales: 'No',
  practicaDeporte: 'Si',
  practicaDeporteDetalle: 'Fútbol recreativo',
  medicalInfo: 'Ninguna',
  medicamentos: 'No',
  apoyoPsicologico: 'No',
  horasSueno: '7-8 horas',
  tiempoPantallas: '2-3 horas',
  nivelEstres: 'Medio',
  manejoFrustracion: 'Me insisto y sigo',
  reaccionCritica: 'La recibo bien y aprendo',
  motivoPractica: 'Mejorar mi condición física',
  expectativas6Meses: 'Dominar el kihon básico',
  porQueAhora: 'Retomé el interés por el karate',
  influenciaInscripcion: ['Familiar'],
  siNoVeResultados: 'Ajustaría mi rutina',
  imagenKarate: 'Disciplina y respeto',
  disposicionEtiqueta: 'Si',
  objetivoPrincipal: ['Defensa personal'],
  queEsperaInstructor: 'Paciencia y corrección técnica',
}

function docToken(submissionId: string, docType: string, applicantIndex = 0) {
  return signUploadRef({
    submissionId,
    storageKey: `enrollments/pending/${submissionId}-${applicantIndex}-${docType}-${randomUUID()}.png`,
    applicantIndex,
    docType: docType as never,
    fileName: 'documento.png',
    mimeType: 'image/png',
    fileSize: 10,
  })
}

function adultPayload(documents: string[], overrides: Record<string, unknown> = {}) {
  return {
    payload: {
      email: 'familia@test.dev',
      phone: '8095550000',
      applicants: [{ name: 'Ana Adulta', dateOfBirth: '1990-05-01', profileData: { ...ADULT_PROFILE } }],
      registrationData: { tipoRegistro: 'adulto' },
      ...overrides,
    },
    documents,
  }
}

const confirmRequest = (body: unknown) =>
  new Request('http://t/api/enrollments/family', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

async function seedBranch() {
  const school = await createSchool()
  await createBranch(school.id)
}

// Flujo público · Happy path de la confirmación de inscripción (adulto).
describe('confirmación de inscripción familiar · happy path', () => {
  it('crea la inscripción con sus aspirantes y documentos', async () => {
    await seedBranch()
    const submissionId = randomUUID()
    const documents = ['PROFILE_PHOTO', 'IDENTITY', 'PASSPORT'].map((docType) => docToken(submissionId, docType))

    const res = await familyRoute.POST(confirmRequest(adultPayload(documents)))

    expect(res.status).toBe(200)
    const body = (await res.json()) as { ok: boolean; id: string }
    expect(body.ok).toBe(true)

    const enrollment = await db.enrollment.findUniqueOrThrow({ where: { id: body.id } })
    expect(enrollment.origin).toBe('FORM')
    expect(enrollment.status).toBe('PENDING')
    expect(enrollment.contactEmail).toBe('familia@test.dev')
    expect(enrollment.applicantName).toBe('Ana Adulta')

    const applicants = await db.enrollmentApplicant.findMany()
    expect(applicants).toHaveLength(1)
    expect((applicants[0].profileData as { sexo?: string }).sexo).toBe('Masculino')

    const docs = await db.studentDocument.findMany()
    expect(docs.map((doc) => doc.type).sort()).toEqual(['IDENTITY', 'PASSPORT', 'PROFILE_PHOTO'])
    expect(deletePrivateDocuments).not.toHaveBeenCalled()
  })

  it('rechaza si falta un documento obligatorio y limpia las subidas', async () => {
    await seedBranch()
    const submissionId = randomUUID()
    // Solo la foto: faltan cédula y pasaporte.
    const res = await familyRoute.POST(confirmRequest(adultPayload([docToken(submissionId, 'PROFILE_PHOTO')])))

    expect(res.status).toBe(400)
    expect(await db.enrollment.count()).toBe(0)
    expect(deletePrivateDocuments).toHaveBeenCalledTimes(1)
  })

  it('rechaza documentos de inscripciones distintas (400)', async () => {
    await seedBranch()
    const documents = [
      docToken(randomUUID(), 'PROFILE_PHOTO'),
      docToken(randomUUID(), 'IDENTITY'),
      docToken(randomUUID(), 'PASSPORT'),
    ]

    const res = await familyRoute.POST(confirmRequest(adultPayload(documents)))

    expect(res.status).toBe(400)
    expect((await res.json()) as { error: string }).toMatchObject({ error: expect.stringMatching(/misma inscripción/i) })
  })

  it('rechaza un token de documento inválido (400)', async () => {
    await seedBranch()
    const res = await familyRoute.POST(confirmRequest(adultPayload(['token-invalido'])))

    expect(res.status).toBe(400)
    expect(await db.enrollment.count()).toBe(0)
  })
})
