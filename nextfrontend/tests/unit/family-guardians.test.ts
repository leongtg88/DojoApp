import { beforeEach, describe, expect, it, vi } from 'vitest'

// Fase 0 · F0-04 — Selección de expediente familiar (alumno propio / hijo / ajeno).
const { studentFindFirst, studentFindMany, guardianStudentFindMany } = vi.hoisted(() => ({
  studentFindFirst: vi.fn(),
  studentFindMany: vi.fn(),
  guardianStudentFindMany: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    student: { findFirst: studentFindFirst, findMany: studentFindMany },
    guardianStudent: { findMany: guardianStudentFindMany },
  },
}))

// `getFamilyMembers` firma URLs de foto; en unit no nos interesa el storage.
vi.mock('@/lib/document-storage', () => ({ createPrivateDocumentUrl: vi.fn(async () => null) }))

import { resolveStudentView } from '@/lib/family/guardians'

interface Row {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  currentRank: string | null
  photoKey: string | null
  registrationData: unknown
}

const row = (id: string, firstName = 'Alumno', lastName = 'Test'): Row => ({
  id,
  firstName,
  lastName,
  dateOfBirth: new Date('2015-01-01T00:00:00.000Z'),
  currentRank: null,
  photoKey: null,
  registrationData: null,
})

/** Configura las tres consultas que hace `getFamilyMembers`. */
function mockFamily({ own = null, children = [] }: { own?: Row | null; children?: Row[] }) {
  studentFindFirst.mockResolvedValue(own)
  guardianStudentFindMany.mockResolvedValue(children.map((student) => ({ relationship: null, student })))
  studentFindMany.mockResolvedValue([])
}

beforeEach(() => {
  studentFindFirst.mockReset()
  studentFindMany.mockReset()
  guardianStudentFindMany.mockReset()
})

describe('resolveStudentView', () => {
  it('sin solicitud devuelve el expediente propio', async () => {
    mockFamily({ own: row('own-1') })
    await expect(resolveStudentView('user-1')).resolves.toEqual({ studentId: 'own-1' })
    await expect(resolveStudentView('user-1', null)).resolves.toEqual({ studentId: 'own-1' })
  })

  it('permite solicitar el propio expediente explícitamente', async () => {
    mockFamily({ own: row('own-1') })
    await expect(resolveStudentView('user-1', 'own-1')).resolves.toEqual({ studentId: 'own-1' })
  })

  it('permite el expediente de un hijo', async () => {
    mockFamily({ own: row('own-1'), children: [row('child-1'), row('child-2')] })
    await expect(resolveStudentView('user-1', 'child-2')).resolves.toEqual({ studentId: 'child-2' })
  })

  it('bloquea un expediente ajeno', async () => {
    mockFamily({ own: row('own-1'), children: [row('child-1')] })
    await expect(resolveStudentView('user-1', 'other-9')).resolves.toBeNull()
  })

  it('tutor sin expediente propio: por defecto el primer hijo', async () => {
    mockFamily({ own: null, children: [row('child-1'), row('child-2')] })
    await expect(resolveStudentView('user-1')).resolves.toEqual({ studentId: 'child-1' })
  })

  it('sin expediente propio ni hijos → null', async () => {
    mockFamily({ own: null, children: [] })
    await expect(resolveStudentView('user-1')).resolves.toBeNull()
  })
})
