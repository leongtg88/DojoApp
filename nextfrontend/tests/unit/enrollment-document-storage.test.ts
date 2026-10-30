import { beforeEach, describe, expect, it, vi } from 'vitest'

const storageMock = vi.hoisted(() => ({ move: vi.fn() }))
const dbMock = vi.hoisted(() => ({ update: vi.fn() }))

vi.mock('@/lib/document-storage', () => ({
  movePrivateDocument: storageMock.move,
  sanitizeStorageName: (name: string) => name,
}))
vi.mock('@/lib/db', () => ({
  db: { studentDocument: { update: dbMock.update } },
}))

const { persistEnrollmentDocument } = await import('@/lib/dashboard/enrollment-document-storage')

const baseInput = {
  document: {
    id: 'doc-1',
    storageKey: 'enrollments/pending/sub-0-IDENTITY-abc-cedula.pdf',
    fileName: 'cedula.pdf',
  },
  enrollmentId: 'enr-1',
  applicantId: 'app-1',
}

beforeEach(() => {
  vi.clearAllMocks()
  storageMock.move.mockResolvedValue(undefined)
  dbMock.update.mockResolvedValue({})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('persistEnrollmentDocument', () => {
  it('mueve el archivo a su ruta definitiva y actualiza el registro', async () => {
    const key = await persistEnrollmentDocument(baseInput)

    expect(storageMock.move).toHaveBeenCalledWith(
      baseInput.document.storageKey,
      'enrollments/enr-1/app-1/doc-1-cedula.pdf',
    )
    expect(dbMock.update).toHaveBeenCalledWith({
      where: { id: 'doc-1' },
      data: { storageKey: 'enrollments/enr-1/app-1/doc-1-cedula.pdf' },
    })
    expect(key).toBe('enrollments/enr-1/app-1/doc-1-cedula.pdf')
  })

  it('mantiene la ruta original si el storage no puede mover el archivo', async () => {
    storageMock.move.mockRejectedValue(new Error('storage caído'))

    const key = await persistEnrollmentDocument(baseInput)

    expect(key).toBe(baseInput.document.storageKey)
    expect(dbMock.update).not.toHaveBeenCalled()
  })

  it('devuelve el archivo a su ruta original si falla la actualización en base de datos', async () => {
    dbMock.update.mockRejectedValue(new Error('db caída'))

    const key = await persistEnrollmentDocument(baseInput)

    expect(key).toBe(baseInput.document.storageKey)
    expect(storageMock.move).toHaveBeenCalledTimes(2)
    expect(storageMock.move).toHaveBeenLastCalledWith(
      'enrollments/enr-1/app-1/doc-1-cedula.pdf',
      baseInput.document.storageKey,
    )
  })
})
