import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/auth', async () => {
  const mod = await import('./route-auth')
  return { auth: mod.authMock.auth }
})

const { db, resetDb } = await import('./db')
const { authMock } = await import('./route-auth')
const { jsonRequest } = await import('./http')
const { createSchool } = await import('./fixtures')

type TestRole = 'STUDENT' | 'GUARDIAN' | 'INSTRUCTOR' | 'SCHOOL_ADMIN' | 'SUPERADMIN'

const holidaysRoute = await import('@/app/api/dashboard/admin/holidays/route')
const convocationsRoute = await import('@/app/api/dashboard/admin/exam-convocations/route')

async function loginAs(schoolId: string | null, roles: TestRole[] = ['SCHOOL_ADMIN']) {
  const user = await db.user.create({ data: { email: `u-${randomUUID()}@test.dev`, roles, schoolId } })
  authMock.setUser(user.id)
  return user
}

beforeEach(async () => {
  await resetDb()
  authMock.setUser(null)
})

// Fase 2 · F2-09 — Feriados y convocatorias de examen.
describe('F2-09 · feriados', () => {
  it('hace upsert del feriado por fecha y escuela', async () => {
    const school = await createSchool()
    await loginAs(school.id)

    const first = await holidaysRoute.POST(jsonRequest('http://t/x', 'POST', { name: 'Cierre', date: '2026-12-24', recurring: true }))
    expect(first.status).toBe(201)

    const second = await holidaysRoute.POST(jsonRequest('http://t/x', 'POST', { name: 'Nochebuena', date: '2026-12-24', recurring: true }))
    expect(second.status).toBe(201)

    const rows = await db.holiday.findMany({ where: { schoolId: school.id } })
    expect(rows).toHaveLength(1)
    expect(rows[0].name).toBe('Nochebuena')
  })

  it('rechaza una fecha con formato inválido (400)', async () => {
    const school = await createSchool()
    await loginAs(school.id)
    const res = await holidaysRoute.POST(jsonRequest('http://t/x', 'POST', { name: 'Cierre', date: '24-12-2026' }))
    expect(res.status).toBe(400)
  })
})

describe('F2-09 · convocatorias de examen', () => {
  it('hace upsert por (escuela, fecha, día) y actualiza la confirmación', async () => {
    const school = await createSchool()
    await loginAs(school.id)

    const first = await convocationsRoute.POST(
      jsonRequest('http://t/x', 'POST', { date: '2026-12-06', examDay: 'SUNDAY', label: 'A', confirmed: false }),
    )
    expect(first.status).toBe(201)

    const second = await convocationsRoute.POST(
      jsonRequest('http://t/x', 'POST', { date: '2026-12-06', examDay: 'SUNDAY', label: 'B', confirmed: true }),
    )
    expect(second.status).toBe(201)

    const rows = await db.examConvocation.findMany({ where: { schoolId: school.id } })
    expect(rows).toHaveLength(1)
    expect(rows[0].label).toBe('B')
    expect(rows[0].confirmed).toBe(true)
  })

  it('el SUPERADMIN sin escuela no puede fijar convocatoria (403)', async () => {
    await loginAs(null, ['SUPERADMIN'])
    const res = await convocationsRoute.POST(jsonRequest('http://t/x', 'POST', { date: '2026-12-06', examDay: 'SUNDAY' }))
    expect(res.status).toBe(403)
  })
})
