import { describe, expect, it } from 'vitest'
import { hasAnyRole, hasRole } from '@/lib/auth/roles'

// Fase 0 · F0-02 — El acceso a cada panel se decide por rol.
describe('hasRole / hasAnyRole', () => {
  it('sin usuario siempre es false', () => {
    expect(hasRole(null, 'STUDENT')).toBe(false)
    expect(hasRole(undefined, 'STUDENT')).toBe(false)
    expect(hasAnyRole(null, ['STUDENT', 'GUARDIAN'])).toBe(false)
  })

  it('usa el array `roles` cuando tiene elementos', () => {
    const user = { roles: ['STUDENT', 'INSTRUCTOR'] }
    expect(hasRole(user, 'INSTRUCTOR')).toBe(true)
    expect(hasRole(user, 'SCHOOL_ADMIN')).toBe(false)
  })

  it('cae al campo heredado `user.role` cuando no hay array', () => {
    expect(hasRole({ role: 'GUARDIAN' }, 'GUARDIAN')).toBe(true)
    expect(hasRole({ role: 'GUARDIAN' }, 'STUDENT')).toBe(false)
  })

  it('con `roles` vacío cae al campo heredado (comportamiento actual)', () => {
    // `roles: []` no cumple `length > 0`, así que resuelve por `user.role`.
    expect(hasRole({ roles: [], role: 'STUDENT' }, 'STUDENT')).toBe(true)
  })

  it('hasAnyRole concede si alguno de los roles coincide', () => {
    const admin = { roles: ['SCHOOL_ADMIN'] }
    expect(hasAnyRole(admin, ['SCHOOL_ADMIN', 'SUPERADMIN'])).toBe(true)
    expect(hasAnyRole(admin, ['INSTRUCTOR', 'STUDENT'])).toBe(false)
  })

  it('un multirol pasa por cualquiera de sus roles', () => {
    const user = { roles: ['STUDENT', 'INSTRUCTOR'] }
    expect(hasAnyRole(user, ['INSTRUCTOR'])).toBe(true)
    expect(hasAnyRole(user, ['STUDENT'])).toBe(true)
    expect(hasAnyRole(user, ['SCHOOL_ADMIN'])).toBe(false)
  })
})
