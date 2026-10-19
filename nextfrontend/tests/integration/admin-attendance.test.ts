import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/auth', async () => {
  const mod = await import('./route-auth')
  return { auth: mod.authMock.auth }
})

vi.mock('@/lib/notifications/create', () => ({
  notifyAssignment: async () => {},
  notifySchoolStaff: async () => {},
  notifyReviewSubmitted: async () => {},
}))

const { db, resetDb } = await import('./db')
const { authMock } = await import('./route-auth')
const { jsonRequest, readJson } = await import('./http')
const { createSchool, createBranch, createClass, createStudent, createUser } = await import('./fixtures')

const passRoute = await import('@/app/api/dashboard/admin/attendance/pass/route')
const attendanceRoute = await import('@/app/api/dashboard/admin/attendance/route')

async function loginAsAdmin(schoolId: string) {
  const admin = await createUser({ email: `a-${randomUUID()}@test.dev`, roles: ['SCHOOL_ADMIN'], schoolId })
  authMock.setUser(admin.id, { roles: ['SCHOOL_ADMIN'], schoolId })
  return admin
}

const dayKey = () => new Date().toISOString().slice(0, 10)

beforeEach(async () => {
  await resetDb()
  authMock.setUser(null)
})

// Fase 7 · F7-01 — Pase de lista del admin (corrección).
describe('F7-01 · pase de lista del admin', () => {
  it('guarda el pase de lista de una clase de su escuela', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsAdmin(school.id)
    const scheduledClass = await createClass({ branchId: branch.id })
    const present = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const absent = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Beto', lastName: 'Dos' })
    await db.classEnrollment.createMany({
      data: [
        { classId: scheduledClass.id, studentId: present.id, status: 'ACTIVE' },
        { classId: scheduledClass.id, studentId: absent.id, status: 'ACTIVE' },
      ],
    })

    const res = await passRoute.POST(
      jsonRequest('http://t/x', 'POST', {
        classId: scheduledClass.id,
        date: dayKey(),
        records: [
          { studentId: present.id, present: true, notes: null },
          { studentId: absent.id, present: false, notes: null },
        ],
      }),
    )

    expect(res.status).toBe(200)
    expect(await db.attendance.count()).toBe(2)
    expect(await db.classSession.count()).toBe(1)
  })

  it('rechaza una clase de otra escuela (404)', async () => {
    const school = await createSchool('A')
    const other = await createSchool('B')
    const otherBranch = await createBranch(other.id)
    await loginAsAdmin(school.id)
    const foreignClass = await createClass({ branchId: otherBranch.id })

    const res = await passRoute.POST(
      jsonRequest('http://t/x', 'POST', { classId: foreignClass.id, date: dayKey(), records: [] }),
    )
    expect(res.status).toBe(404)
  })
})

// Fase 7 · F7-02 — Acciones masivas de asistencia.
describe('F7-02 · acciones masivas de asistencia', () => {
  it('confirma y rechaza registros en bloque', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsAdmin(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const other = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Beto', lastName: 'Dos' })
    const toConfirm = await db.attendance.create({
      data: { studentId: student.id, date: new Date(), present: true, status: 'PENDING', hoursTrained: 1.5 },
      select: { id: true },
    })
    const toReject = await db.attendance.create({
      data: { studentId: other.id, date: new Date(), present: false, status: 'PENDING', hoursTrained: 0 },
      select: { id: true },
    })

    const confirm = await attendanceRoute.POST(
      jsonRequest('http://t/x', 'POST', { action: 'CONFIRMED', ids: [toConfirm.id], notes: 'validado' }),
    )
    expect(confirm.status).toBe(200)
    expect((await readJson<{ updated: number }>(confirm)).updated).toBe(1)
    expect((await db.attendance.findUniqueOrThrow({ where: { id: toConfirm.id } })).status).toBe('CONFIRMED')

    const reject = await attendanceRoute.POST(jsonRequest('http://t/x', 'POST', { action: 'REJECTED', ids: [toReject.id] }))
    expect(reject.status).toBe(200)
    expect((await db.attendance.findUniqueOrThrow({ where: { id: toReject.id } })).status).toBe('REJECTED')
  })

  it('rechaza ids que no son válidos para la acción (400)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsAdmin(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const alreadyConfirmed = await db.attendance.create({
      data: { studentId: student.id, date: new Date(), present: true, status: 'CONFIRMED', hoursTrained: 1 },
      select: { id: true },
    })

    const res = await attendanceRoute.POST(
      jsonRequest('http://t/x', 'POST', { action: 'CONFIRMED', ids: [alreadyConfirmed.id] }),
    )
    expect(res.status).toBe(400)
  })
})
