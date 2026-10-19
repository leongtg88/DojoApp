import { beforeEach, describe, expect, it, vi } from 'vitest'

const { buildCarnetPdf } = vi.hoisted(() => ({ buildCarnetPdf: vi.fn(async () => new Uint8Array([0x25, 0x50, 0x44, 0x46])) }))
const { sendDocumentToTelegram } = vi.hoisted(() => ({ sendDocumentToTelegram: vi.fn(async () => {}) }))

vi.mock('@/lib/pdf/carnet', () => ({ buildCarnetPdf }))
vi.mock('@/lib/integrations/telegram', () => ({ sendDocumentToTelegram }))
vi.mock('@/lib/document-storage', () => ({
  uploadPrivateDocument: async () => {},
  downloadPrivateDocument: async () => ({ buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), contentType: 'image/png' }),
  sanitizeStorageName: (name: string) => name,
}))

const { db, resetDb } = await import('./db')
const { createSchool, createBranch } = await import('./fixtures')
const { generateCarnetForStudent } = await import('@/lib/pdf/carnet-data')

beforeEach(async () => {
  buildCarnetPdf.mockClear()
  sendDocumentToTelegram.mockClear()
  await resetDb()
})

// Carnet de federación al convertir: solo se genera con TODOS los campos.
describe('carnet de federación (generateCarnetForStudent)', () => {
  it('no genera nada si faltan campos obligatorios', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const student = await db.student.create({
      data: { schoolId: school.id, branchId: branch.id, firstName: 'Beto', lastName: 'Dos', dateOfBirth: new Date('2010-01-01T00:00:00.000Z') },
      select: { id: true },
    })

    await generateCarnetForStudent(student.id)

    expect(await db.studentDocument.count({ where: { studentId: student.id } })).toBe(0)
    expect(buildCarnetPdf).not.toHaveBeenCalled()
  })

  it('genera el PDF, lo guarda en el expediente y lo envía por Telegram', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const student = await db.student.create({
      data: {
        schoolId: school.id,
        branchId: branch.id,
        firstName: 'Ana',
        lastName: 'Uno',
        dateOfBirth: new Date('1990-05-01T00:00:00.000Z'),
        gender: 'FEMALE',
        contactPhone: '8095550000',
        currentRank: 'Blanco',
        photoKey: 'carnet/students/ana.png',
        registrationData: { bloodType: 'O+', nationalId: '00112345678', address: 'Calle 1' },
      },
      select: { id: true },
    })

    await generateCarnetForStudent(student.id)

    const document = await db.studentDocument.findFirstOrThrow({ where: { studentId: student.id } })
    expect(document.type).toBe('OTHER')
    expect(document.mimeType).toBe('application/pdf')
    expect(buildCarnetPdf).toHaveBeenCalledTimes(1)
    expect(sendDocumentToTelegram).toHaveBeenCalledTimes(1)
  })
})
