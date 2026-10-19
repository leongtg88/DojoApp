import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
const { createSchool, createBranch, createClass, createStudentAccount } = await import('./fixtures')
const { consumeRateLimit } = await import('@/lib/security/rate-limit')

const absenceRoute = await import('@/app/api/dashboard/student/absence/route')

async function loginAsStudent(schoolId: string, branchId: string) {
  const account = await createStudentAccount({ schoolId, branchId })
  authMock.setUser(account.userId, { roles: ['STUDENT'] })
  return account
}

const dayKey = (offsetDays = 0) => new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

beforeEach(async () => {
  // Reloj congelado: la ventana de 30 días y el rate-limit no deben depender de la fecha real.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'))
  await resetDb()
  authMock.setUser(null)
})

afterEach(() => {
  vi.useRealTimers()
})

// Fase 5 · F5-03 — Reportar inasistencia.
describe('F5-03 · reportar inasistencia', () => {
  it('registra una inasistencia válida de una clase inscrita', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const { studentId } = await loginAsStudent(school.id, branch.id)
    const scheduledClass = await createClass({ branchId: branch.id })
    await db.classEnrollment.create({ data: { classId: scheduledClass.id, studentId, status: 'ACTIVE' } })

    const res = await absenceRoute.POST(
      jsonRequest('http://t/x', 'POST', { classId: scheduledClass.id, date: dayKey(), reason: 'enfermedad' }),
    )

    expect(res.status).toBe(201)
    const rows = await db.absenceJustification.findMany()
    expect(rows).toHaveLength(1)
    expect(rows[0].status).toBe('PENDING')
  })

  it('rechaza fecha futura y fuera de la ventana de 30 días (400)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const { studentId } = await loginAsStudent(school.id, branch.id)
    const scheduledClass = await createClass({ branchId: branch.id })
    await db.classEnrollment.create({ data: { classId: scheduledClass.id, studentId, status: 'ACTIVE' } })

    const future = await absenceRoute.POST(
      jsonRequest('http://t/x', 'POST', { classId: scheduledClass.id, date: dayKey(1), reason: 'motivo' }),
    )
    expect(future.status).toBe(400)

    const old = await absenceRoute.POST(
      jsonRequest('http://t/x', 'POST', { classId: scheduledClass.id, date: dayKey(-40), reason: 'motivo' }),
    )
    expect(old.status).toBe(400)
  })

  it('rechaza una clase en la que el alumno no está inscrito (403)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsStudent(school.id, branch.id)
    const scheduledClass = await createClass({ branchId: branch.id })

    const res = await absenceRoute.POST(
      jsonRequest('http://t/x', 'POST', { classId: scheduledClass.id, date: dayKey(), reason: 'motivo' }),
    )
    expect(res.status).toBe(403)
  })
})

// Fase 5 · F5-04 — Retirar reporte pendiente.
describe('F5-04 · retirar reporte de inasistencia', () => {
  it('retira un reporte pendiente y rechaza uno ya revisado (409)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const { studentId } = await loginAsStudent(school.id, branch.id)
    const scheduledClass = await createClass({ branchId: branch.id })
    await db.classEnrollment.create({ data: { classId: scheduledClass.id, studentId, status: 'ACTIVE' } })

    const created = await absenceRoute.POST(
      jsonRequest('http://t/x', 'POST', { classId: scheduledClass.id, date: dayKey(), reason: 'viaje' }),
    )
    const { justification } = await readJson<{ justification: { id: string } }>(created)

    const removed = await absenceRoute.DELETE(new Request(`http://t/x?id=${justification.id}`, { method: 'DELETE' }))
    expect(removed.status).toBe(200)
    expect(await db.absenceJustification.count()).toBe(0)

    const again = await absenceRoute.POST(
      jsonRequest('http://t/x', 'POST', { classId: scheduledClass.id, date: dayKey(), reason: 'viaje' }),
    )
    const second = await readJson<{ justification: { id: string } }>(again)
    await db.absenceJustification.update({ where: { id: second.justification.id }, data: { status: 'APPROVED' } })

    const blocked = await absenceRoute.DELETE(new Request(`http://t/x?id=${second.justification.id}`, { method: 'DELETE' }))
    expect(blocked.status).toBe(409)
  })
})

// Fase 5 · F5-07 — Rate limit del reporte de inasistencia.
describe('F5-07 · rate limit de inasistencia', () => {
  it('bloquea con 429 al superar el límite por alumno', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const { studentId } = await loginAsStudent(school.id, branch.id)
    const scheduledClass = await createClass({ branchId: branch.id })
    await db.classEnrollment.create({ data: { classId: scheduledClass.id, studentId, status: 'ACTIVE' } })

    for (let index = 0; index < 20; index += 1) {
      await consumeRateLimit(`absence-report:student:${studentId}`, { limit: 20, windowMs: 60 * 60 * 1000 })
    }

    const res = await absenceRoute.POST(
      jsonRequest('http://t/x', 'POST', { classId: scheduledClass.id, date: dayKey(), reason: 'motivo' }),
    )
    expect(res.status).toBe(429)
  })
})
