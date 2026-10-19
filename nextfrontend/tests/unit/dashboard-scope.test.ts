import { beforeEach, describe, expect, it, vi } from 'vitest'

// Fase 0 · F0-03 — El alcance se resuelve por helpers, no a mano (INV-06).
const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }))

vi.mock('@/lib/db', () => ({ db: { user: { findUnique } } }))

import { getAdminScope, scopeSchoolFilter } from '@/lib/dashboard/scope'

beforeEach(() => findUnique.mockReset())

describe('getAdminScope', () => {
  it('SUPERADMIN ve todo (sin acotar escuela ni sucursal)', async () => {
    findUnique.mockResolvedValue({ roles: ['SUPERADMIN'], schoolId: null, branchId: null })
    await expect(getAdminScope('u1')).resolves.toEqual({ isSuperAdmin: true, schoolId: null, branchId: null })
  })

  it('SCHOOL_ADMIN con escuela queda acotado a su escuela', async () => {
    findUnique.mockResolvedValue({ roles: ['SCHOOL_ADMIN'], schoolId: 's1', branchId: 'b1' })
    await expect(getAdminScope('u1')).resolves.toEqual({ isSuperAdmin: false, schoolId: 's1', branchId: 'b1' })
  })

  it('SCHOOL_ADMIN sin escuela es inválido', async () => {
    findUnique.mockResolvedValue({ roles: ['SCHOOL_ADMIN'], schoolId: null, branchId: null })
    await expect(getAdminScope('u1')).resolves.toBeNull()
  })

  it('un usuario sin rol admin no tiene scope', async () => {
    findUnique.mockResolvedValue({ roles: ['STUDENT', 'INSTRUCTOR'], schoolId: 's1', branchId: null })
    await expect(getAdminScope('u1')).resolves.toBeNull()
  })

  it('usuario inexistente → null', async () => {
    findUnique.mockResolvedValue(null)
    await expect(getAdminScope('u1')).resolves.toBeNull()
  })

  it('un SUPERADMIN que además es SCHOOL_ADMIN no requiere escuela', async () => {
    findUnique.mockResolvedValue({ roles: ['SCHOOL_ADMIN', 'SUPERADMIN'], schoolId: null, branchId: null })
    await expect(getAdminScope('u1')).resolves.toEqual({ isSuperAdmin: true, schoolId: null, branchId: null })
  })
})

describe('scopeSchoolFilter', () => {
  it('el superadmin no filtra', () => {
    expect(scopeSchoolFilter({ isSuperAdmin: true, schoolId: null, branchId: null })).toEqual({})
  })

  it('el admin de escuela filtra por su schoolId', () => {
    expect(scopeSchoolFilter({ isSuperAdmin: false, schoolId: 's1', branchId: null })).toEqual({ schoolId: 's1' })
  })
})
