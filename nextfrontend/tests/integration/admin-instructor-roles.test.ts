import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/auth', async () => {
  const mod = await import('./route-auth')
  return { auth: mod.authMock.auth }
})

const { db, resetDb } = await import('./db')
const { authMock } = await import('./route-auth')
const { jsonRequest } = await import('./http')
const { createSchool, createBranch, createStudent, createStudentAccount, createUser } = await import('./fixtures')

const instructorsRoute = await import('@/app/api/dashboard/admin/instructors/route')

async function loginAsAdmin(schoolId: string) {
  const admin = await createUser({ email: `a-${randomUUID()}@test.dev`, roles: ['SCHOOL_ADMIN'], schoolId })
  authMock.setUser(admin.id, { roles: ['SCHOOL_ADMIN'], schoolId })
  return admin
}

beforeEach(async () => {
  await resetDb()
  authMock.setUser(null)
})

// Fase 7 · F7-07 — Conceder/revocar el rol de instructor.
describe('F7-07 · roles de instructor', () => {
  it('concede el rol (y la escuela) y luego lo revoca', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsAdmin(school.id)
    const account = await createStudentAccount({ schoolId: school.id, branchId: branch.id })

    const grant = await instructorsRoute.POST(
      jsonRequest('http://t/x', 'POST', { studentId: account.studentId, grant: true }),
    )
    expect(grant.status).toBe(200)
    const granted = await db.user.findUniqueOrThrow({ where: { id: account.userId } })
    expect(granted.roles).toContain('INSTRUCTOR')
    expect(granted.schoolId).toBe(school.id)

    const revoke = await instructorsRoute.POST(
      jsonRequest('http://t/x', 'POST', { studentId: account.studentId, grant: false }),
    )
    expect(revoke.status).toBe(200)
    const revoked = await db.user.findUniqueOrThrow({ where: { id: account.userId } })
    expect(revoked.roles).not.toContain('INSTRUCTOR')
    expect(revoked.roles).toContain('STUDENT')
  })

  it('rechaza un alumno sin cuenta activa (400)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsAdmin(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })

    const res = await instructorsRoute.POST(jsonRequest('http://t/x', 'POST', { studentId: student.id, grant: true }))
    expect(res.status).toBe(400)
  })

  it('no alcanza alumnos de otra escuela (400)', async () => {
    const school = await createSchool('A')
    const other = await createSchool('B')
    const otherBranch = await createBranch(other.id)
    await loginAsAdmin(school.id)
    const foreign = await createStudentAccount({ schoolId: other.id, branchId: otherBranch.id })

    const res = await instructorsRoute.POST(
      jsonRequest('http://t/x', 'POST', { studentId: foreign.studentId, grant: true }),
    )
    expect(res.status).toBe(400)
  })
})
