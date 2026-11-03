import { beforeEach, describe, expect, it, vi } from 'vitest'

// El barrido toca BD y storage: se sustituyen por dobles para probar la regla de
// seguridad sin Postgres ni Supabase.
const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }))
const { listPrivateDocuments, deletePrivateDocuments } = vi.hoisted(() => ({
  listPrivateDocuments: vi.fn(),
  deletePrivateDocuments: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db: { studentDocument: { findMany } } }))
vi.mock('@/lib/document-storage', () => ({
  PENDING_UPLOADS_PREFIX: 'enrollments/pending',
  listPrivateDocuments,
  deletePrivateDocuments,
}))

import { purgeStalePendingUploads } from '@/lib/dashboard/registration-purge'

const HOUR = 60 * 60 * 1000
const oldDate = () => new Date(Date.now() - 48 * HOUR).toISOString()
const freshDate = () => new Date(Date.now() - 30 * 60 * 1000).toISOString()

beforeEach(() => {
  findMany.mockReset()
  listPrivateDocuments.mockReset()
  deletePrivateDocuments.mockReset()
})

describe('purgeStalePendingUploads · nunca borra documentos del expediente', () => {
  it('borra el huérfano antiguo y respeta el que está referenciado', async () => {
    listPrivateDocuments.mockResolvedValue([
      { name: 'ana-pasaporte.pdf', createdAt: oldDate() },
      { name: 'huerfano.pdf', createdAt: oldDate() },
    ])
    findMany.mockResolvedValue([{ storageKey: 'enrollments/pending/ana-pasaporte.pdf' }])

    const purged = await purgeStalePendingUploads(24)

    expect(purged).toBe(1)
    expect(deletePrivateDocuments).toHaveBeenCalledTimes(1)
    expect(deletePrivateDocuments).toHaveBeenCalledWith(['enrollments/pending/huerfano.pdf'])
  })

  it('si todos los objetos antiguos están referenciados, no borra nada', async () => {
    listPrivateDocuments.mockResolvedValue([
      { name: 'acta.pdf', createdAt: oldDate() },
      { name: 'foto.jpg', createdAt: oldDate() },
    ])
    findMany.mockResolvedValue([
      { storageKey: 'enrollments/pending/acta.pdf' },
      { storageKey: 'enrollments/pending/foto.jpg' },
    ])

    await expect(purgeStalePendingUploads(24)).resolves.toBe(0)
    expect(deletePrivateDocuments).not.toHaveBeenCalled()
  })

  it('no toca objetos que aún están dentro de la ventana de 24 h', async () => {
    listPrivateDocuments.mockResolvedValue([{ name: 'recien-subido.pdf', createdAt: freshDate() }])
    findMany.mockResolvedValue([])

    await expect(purgeStalePendingUploads(24)).resolves.toBe(0)
    expect(findMany).not.toHaveBeenCalled()
    expect(deletePrivateDocuments).not.toHaveBeenCalled()
  })

  it('ignora objetos sin fecha de creación (no se puede saber si son antiguos)', async () => {
    listPrivateDocuments.mockResolvedValue([{ name: 'sin-fecha.pdf', createdAt: null }])

    await expect(purgeStalePendingUploads(24)).resolves.toBe(0)
    expect(deletePrivateDocuments).not.toHaveBeenCalled()
  })

  it('si el storage falla, devuelve 0 y no propaga el error', async () => {
    listPrivateDocuments.mockRejectedValue(new Error('network'))

    await expect(purgeStalePendingUploads(24)).resolves.toBe(0)
    expect(deletePrivateDocuments).not.toHaveBeenCalled()
  })
})
