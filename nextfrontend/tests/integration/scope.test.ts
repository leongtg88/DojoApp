import { beforeEach, describe, expect, it } from 'vitest'
import { Role } from '@/lib/generated/prisma'

const { db, resetDb } = await import('./db')
const { createSchool } = await import('./fixtures')
const { getAdminScope, scopeSchoolFilter } = await import('@/lib/dashboard/scope')

beforeEach(resetDb)

// Fase 0 · F0-03 — El alcance se resuelve contra la BD y respeta la escuela (INV-06).
describe('getAdminScope (integración)', () => {
  it('SUPERADMIN ve todo', async () => {
    const user = await db.user.create({ data: { email: 'super@test.dev', roles: [Role.SUPERADMIN] } })
    await expect(getAdminScope(user.id)).resolves.toEqual({ isSuperAdmin: true, schoolId: null, branchId: null })
  })

  it('SCHOOL_ADMIN queda acotado a su escuela y sucursal', async () => {
    const school = await createSchool()
    const user = await db.user.create({
      data: { email: 'admin@test.dev', roles: [Role.SCHOOL_ADMIN], schoolId: school.id },
    })
    const scope = await getAdminScope(user.id)
    expect(scope).toEqual({ isSuperAdmin: false, schoolId: school.id, branchId: null })
    expect(scopeSchoolFilter(scope!)).toEqual({ schoolId: school.id })
  })

  it('SCHOOL_ADMIN sin escuela es inválido', async () => {
    const user = await db.user.create({ data: { email: 'admin2@test.dev', roles: [Role.SCHOOL_ADMIN] } })
    await expect(getAdminScope(user.id)).resolves.toBeNull()
  })

  it('un alumno no tiene scope', async () => {
    const user = await db.user.create({ data: { email: 'student@test.dev', roles: [Role.STUDENT] } })
    await expect(getAdminScope(user.id)).resolves.toBeNull()
  })

  it('un usuario inexistente → null', async () => {
    await expect(getAdminScope('no-existe')).resolves.toBeNull()
  })

  it('scopeSchoolFilter del superadmin no filtra', () => {
    expect(scopeSchoolFilter({ isSuperAdmin: true, schoolId: null, branchId: null })).toEqual({})
  })
})
