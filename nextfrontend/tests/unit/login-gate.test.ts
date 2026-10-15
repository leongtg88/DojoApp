import { beforeEach, describe, expect, it, vi } from 'vitest'

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }))

vi.mock('@/lib/db', () => ({ db: { student: { findFirst } } }))

import { userHasDashboardAccess } from '@/lib/auth/login-gate'

beforeEach(() => {
  findFirst.mockReset()
})

describe('userHasDashboardAccess', () => {
  it('permite al staff y a los tutores sin consultar la base de datos', async () => {
    await expect(userHasDashboardAccess({ id: 'u1', roles: ['GUARDIAN'] })).resolves.toBe(true)
    await expect(userHasDashboardAccess({ id: 'u2', roles: ['STUDENT', 'INSTRUCTOR'] })).resolves.toBe(true)
    await expect(userHasDashboardAccess({ id: 'u3', roles: ['SCHOOL_ADMIN'] })).resolves.toBe(true)
    expect(findFirst).not.toHaveBeenCalled()
  })

  it('permite a un alumno con expediente de inscripción', async () => {
    findFirst.mockResolvedValue({ id: 'student-1' })
    await expect(userHasDashboardAccess({ id: 'u1', roles: ['STUDENT'] })).resolves.toBe(true)
    expect(findFirst).toHaveBeenCalledTimes(1)
  })

  it('bloquea a un alumno sin expediente', async () => {
    findFirst.mockResolvedValue(null)
    await expect(userHasDashboardAccess({ id: 'u1', roles: ['STUDENT'] })).resolves.toBe(false)
  })
})
