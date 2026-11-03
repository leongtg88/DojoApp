import { beforeEach, describe, expect, it, vi } from 'vitest'

const { findMany, update } = vi.hoisted(() => ({ findMany: vi.fn(), update: vi.fn() }))
const { copyPrivateDocument, deletePrivateDocuments } = vi.hoisted(() => ({
  copyPrivateDocument: vi.fn(),
  deletePrivateDocuments: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db: { studentDocument: { findMany, update } } }))
vi.mock('@/lib/document-storage', () => ({
  PENDING_UPLOADS_PREFIX: 'enrollments/pending',
  STUDENT_DOCUMENTS_PREFIX: 'students',
  sanitizeStorageName: (name: string) => name.replace(/[^A-Za-z0-9._-]/g, '_'),
  copyPrivateDocument,
  deletePrivateDocuments,
}))

import { finalDocumentKey, finalizeStudentDocuments } from '@/lib/dashboard/document-finalize'

beforeEach(() => {
  findMany.mockReset()
  update.mockReset()
  copyPrivateDocument.mockReset()
  deletePrivateDocuments.mockReset()
  copyPrivateDocument.mockResolvedValue(undefined)
  deletePrivateDocuments.mockResolvedValue(undefined)
  update.mockResolvedValue(undefined)
})

describe('finalDocumentKey', () => {
  it('coloca el documento bajo students/<id> conservando el nombre original', () => {
    const key = finalDocumentKey('stu1', 'pasaporte.pdf')
    expect(key).toMatch(/^students\/stu1\/[0-9a-f-]+-pasaporte\.pdf$/)
  })
})

describe('finalizeStudentDocuments', () => {
  it('copia, actualiza el storageKey y después borra el original', async () => {
    findMany.mockResolvedValue([
      { id: 'doc1', storageKey: 'enrollments/pending/sub-0-PASSPORT-uuid-pasaporte.pdf', fileName: 'pasaporte.pdf' },
    ])

    await expect(finalizeStudentDocuments('stu1', 'enr1')).resolves.toBe(1)

    const targetKey = update.mock.calls[0][0].data.storageKey as string
    expect(targetKey).toMatch(/^students\/stu1\/[0-9a-f-]+-pasaporte\.pdf$/)
    expect(copyPrivateDocument).toHaveBeenCalledWith('enrollments/pending/sub-0-PASSPORT-uuid-pasaporte.pdf', targetKey)
    expect(update).toHaveBeenCalledWith({ where: { id: 'doc1' }, data: { storageKey: targetKey } })
    expect(deletePrivateDocuments).toHaveBeenCalledWith(['enrollments/pending/sub-0-PASSPORT-uuid-pasaporte.pdf'])
  })

  it('solo busca documentos del alumno que sigan en el prefijo efímero', async () => {
    findMany.mockResolvedValue([])

    await expect(finalizeStudentDocuments('stu1', 'enr1')).resolves.toBe(0)

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          studentId: 'stu1',
          enrollmentId: 'enr1',
          storageKey: { startsWith: 'enrollments/pending/' },
        }),
      }),
    )
    expect(copyPrivateDocument).not.toHaveBeenCalled()
  })

  it('si la copia falla, conserva el original y no borra nada', async () => {
    findMany.mockResolvedValue([{ id: 'doc1', storageKey: 'enrollments/pending/a.pdf', fileName: 'a.pdf' }])
    copyPrivateDocument.mockRejectedValue(new Error('storage caído'))

    await expect(finalizeStudentDocuments('stu1', 'enr1')).resolves.toBe(0)

    expect(update).not.toHaveBeenCalled()
    expect(deletePrivateDocuments).not.toHaveBeenCalled()
  })

  it('si falla el borrado del original, el documento ya quedó finalizado', async () => {
    findMany.mockResolvedValue([{ id: 'doc1', storageKey: 'enrollments/pending/a.pdf', fileName: 'a.pdf' }])
    deletePrivateDocuments.mockRejectedValue(new Error('no se pudo borrar'))

    await expect(finalizeStudentDocuments('stu1', 'enr1')).resolves.toBe(1)
    expect(update).toHaveBeenCalledTimes(1)
  })
})
