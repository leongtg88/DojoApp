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
const { jsonRequest, routeParams, readJson } = await import('./http')
const { createSchool, createBranch, createStudent, createUser, createPlan, createClass } = await import('./fixtures')

type TestRole = 'STUDENT' | 'GUARDIAN' | 'INSTRUCTOR' | 'SCHOOL_ADMIN' | 'SUPERADMIN'

const plansItemRoute = await import('@/app/api/dashboard/admin/plans/[planId]/route')
const classesRoute = await import('@/app/api/dashboard/admin/classes/route')
const classItemRoute = await import('@/app/api/dashboard/admin/classes/[classId]/route')
const enrollRoute = await import('@/app/api/dashboard/admin/classes/[classId]/enroll/route')

async function loginAs(schoolId: string | null, roles: TestRole[] = ['SCHOOL_ADMIN']) {
  const user = await db.user.create({ data: { email: `u-${randomUUID()}@test.dev`, roles, schoolId } })
  authMock.setUser(user.id)
  return user
}

beforeEach(async () => {
  await resetDb()
  authMock.setUser(null)
})

// Fase 2 · F2-06 — Planes: no se elimina uno con alumnos asignados.
describe('F2-06 · eliminar plan', () => {
  it('elimina un plan sin alumnos', async () => {
    const school = await createSchool()
    await loginAs(school.id)
    const plan = await createPlan({ schoolId: school.id })

    const res = await plansItemRoute.DELETE(jsonRequest('http://t/x', 'DELETE'), routeParams({ planId: plan.id }))

    expect(res.status).toBe(200)
    expect(await db.plan.count()).toBe(0)
  })

  it('rechaza eliminar un plan con alumnos asignados (409)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAs(school.id)
    const plan = await createPlan({ schoolId: school.id })
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    await db.student.update({ where: { id: student.id }, data: { planId: plan.id } })

    const res = await plansItemRoute.DELETE(jsonRequest('http://t/x', 'DELETE'), routeParams({ planId: plan.id }))
    expect(res.status).toBe(409)
    expect(await db.plan.count()).toBe(1)
  })
})

// Fase 2 · F2-07 — Horarios: solape de instructor y desactivación segura.
describe('F2-07 · horarios', () => {
  it('rechaza un solape de instructor (409) y permite una franja libre', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAs(school.id)
    const instructor = await createUser({ email: `i-${randomUUID()}@test.dev`, roles: ['INSTRUCTOR'], schoolId: school.id })
    await createClass({ branchId: branch.id, instructorId: instructor.id, dayOfWeek: 1, startTime: '19:00', endTime: '21:00' })

    const conflict = await classesRoute.POST(
      jsonRequest('http://t/x', 'POST', { name: 'Otra', branchId: branch.id, dayOfWeek: 1, startTime: '20:00', endTime: '22:00', instructorId: instructor.id }),
    )
    expect(conflict.status).toBe(409)

    const ok = await classesRoute.POST(
      jsonRequest('http://t/x', 'POST', { name: 'Temprana', branchId: branch.id, dayOfWeek: 1, startTime: '17:00', endTime: '18:00', instructorId: instructor.id }),
    )
    expect(ok.status).toBe(201)
  })

  it('desactiva una clase con actividad en lugar de borrarla', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAs(school.id)
    const cls = await createClass({ branchId: branch.id })
    await db.classSession.create({ data: { classId: cls.id, date: new Date('2026-01-05T00:00:00.000Z') } })

    const res = await classItemRoute.DELETE(jsonRequest('http://t/x', 'DELETE'), routeParams({ classId: cls.id }))

    expect(res.status).toBe(200)
    expect((await readJson<{ deactivated: boolean }>(res)).deactivated).toBe(true)
    expect((await db.class.findUniqueOrThrow({ where: { id: cls.id } })).active).toBe(false)
  })

  it('borra una clase sin actividad', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAs(school.id)
    const cls = await createClass({ branchId: branch.id })

    const res = await classItemRoute.DELETE(jsonRequest('http://t/x', 'DELETE'), routeParams({ classId: cls.id }))

    expect(res.status).toBe(200)
    expect((await readJson<{ deactivated: boolean }>(res)).deactivated).toBe(false)
    expect(await db.class.findUnique({ where: { id: cls.id } })).toBeNull()
  })
})

// Fase 2 · F2-08 — Inscribir/desinscribir alumnos en una clase.
describe('F2-08 · inscripción a clase', () => {
  it('inscribe (idempotente) y luego da de baja', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAs(school.id)
    const cls = await createClass({ branchId: branch.id })
    const s1 = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const s2 = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Beto', lastName: 'Dos' })

    const first = await enrollRoute.POST(
      jsonRequest('http://t/x', 'POST', { studentIds: [s1.id, s2.id] }),
      routeParams({ classId: cls.id }),
    )
    expect(first.status).toBe(201)
    expect(await db.classEnrollment.count({ where: { classId: cls.id, status: 'ACTIVE' } })).toBe(2)

    // Repetir es idempotente (upsert).
    await enrollRoute.POST(jsonRequest('http://t/x', 'POST', { studentIds: [s1.id, s2.id] }), routeParams({ classId: cls.id }))
    expect(await db.classEnrollment.count({ where: { classId: cls.id, status: 'ACTIVE' } })).toBe(2)

    const removed = await enrollRoute.DELETE(
      jsonRequest('http://t/x', 'DELETE', { studentIds: [s1.id] }),
      routeParams({ classId: cls.id }),
    )
    expect(removed.status).toBe(200)
    const s1Enrollment = await db.classEnrollment.findFirstOrThrow({ where: { classId: cls.id, studentId: s1.id } })
    expect(s1Enrollment.status).toBe('ENDED')
  })

  it('rechaza inscribir alumnos de otra escuela (400)', async () => {
    const school = await createSchool('A')
    const branch = await createBranch(school.id)
    const other = await createSchool('B')
    const otherBranch = await createBranch(other.id)
    await loginAs(school.id)
    const cls = await createClass({ branchId: branch.id })
    const ajeno = await createStudent({ schoolId: other.id, branchId: otherBranch.id, firstName: 'Ajeno', lastName: 'X' })

    const res = await enrollRoute.POST(
      jsonRequest('http://t/x', 'POST', { studentIds: [ajeno.id] }),
      routeParams({ classId: cls.id }),
    )
    expect(res.status).toBe(400)
  })
})
