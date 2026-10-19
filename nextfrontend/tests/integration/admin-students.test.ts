import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

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
const { createSchool, createBranch, createStudent, createTechnique, createPlan, createClass } = await import('./fixtures')

const studentsRoute = await import('@/app/api/dashboard/admin/students/route')
const studentItemRoute = await import('@/app/api/dashboard/admin/students/[studentId]/route')
const placementRoute = await import('@/app/api/dashboard/admin/students/[studentId]/placement/route')
const inviteRoute = await import('@/app/api/dashboard/admin/students/[studentId]/invite/route')
const bulkKataRoute = await import('@/app/api/dashboard/admin/students/assign-techniques-bulk/route')

type TestRole = 'STUDENT' | 'GUARDIAN' | 'INSTRUCTOR' | 'SCHOOL_ADMIN' | 'SUPERADMIN'

async function loginAs(schoolId: string | null, roles: TestRole[] = ['SCHOOL_ADMIN']) {
  const user = await db.user.create({ data: { email: `u-${randomUUID()}@test.dev`, roles, schoolId } })
  authMock.setUser(user.id)
  return user
}

beforeEach(async () => {
  await resetDb()
  authMock.setUser(null)
})

// Fase 3 · F3-01 — Crear alumno con matrícula y grado inicial.
describe('F3-01 · crear alumno', () => {
  it('crea el expediente con matrícula sugerida y grado por defecto', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAs(school.id)
    const rank = await db.beltRank.create({
      data: { program: 'ADULT', name: 'Blanco', order: 1, schoolId: school.id },
      select: { id: true },
    })

    const res = await studentsRoute.POST(
      jsonRequest('http://t/x', 'POST', { firstName: 'Ana', lastName: 'Uno', dateOfBirth: '1990-05-01', branchId: branch.id }),
    )

    expect(res.status).toBe(201)
    const body = await readJson<{ studentId: string; memberNumber: string }>(res)
    expect(body.memberNumber).toMatch(/^KYU-\d{4}-\d{3}$/)

    const created = await db.student.findUniqueOrThrow({ where: { id: body.studentId } })
    expect(created.schoolId).toBe(school.id)
    expect(created.currentRank).toBe('Blanco')
    expect(created.currentRankId).toBe(rank.id)
  })

  it('rechaza datos inválidos (400)', async () => {
    const school = await createSchool()
    await loginAs(school.id)
    const res = await studentsRoute.POST(jsonRequest('http://t/x', 'POST', { firstName: '', lastName: '' }))
    expect(res.status).toBe(400)
  })

  it('no permite crear en una sucursal de otra escuela (403)', async () => {
    const school = await createSchool('A')
    const other = await createSchool('B')
    const otherBranch = await createBranch(other.id)
    await loginAs(school.id)

    const res = await studentsRoute.POST(
      jsonRequest('http://t/x', 'POST', { firstName: 'Ana', lastName: 'Uno', dateOfBirth: '1990-05-01', branchId: otherBranch.id }),
    )
    expect(res.status).toBe(403)
  })
})

// Fase 3 · F3-02 — Editar alumno, estado y purga de inscripción.
describe('F3-02 · editar y dar de baja', () => {
  it('actualiza datos y cambia el estado', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAs(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })

    const res = await studentItemRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { firstName: 'Ana María', status: 'INACTIVE' }),
      routeParams({ studentId: student.id }),
    )

    expect(res.status).toBe(200)
    const updated = await db.student.findUniqueOrThrow({ where: { id: student.id } })
    expect(updated.firstName).toBe('Ana María')
    expect(updated.status).toBe('INACTIVE')
  })

  it('purga los datos de inscripción al dar de baja con la opción activada', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAs(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    await db.student.update({ where: { id: student.id }, data: { registrationData: { rol: 'alumno', extra: 1 } } })

    const res = await studentItemRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { status: 'INACTIVE', purgeRegistrationData: true }),
      routeParams({ studentId: student.id }),
    )

    expect(res.status).toBe(200)
    const updated = await db.student.findUniqueOrThrow({ where: { id: student.id } })
    expect(updated.registrationData).toBeNull()
  })
})

// Fase 3 · F3-03 — Placement: plan, horarios, beca y competidor.
describe('F3-03 · plan y horarios', () => {
  it('asigna plan y horarios y sincroniza las inscripciones', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAs(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const plan = await createPlan({ schoolId: school.id })
    const cls = await createClass({ branchId: branch.id })

    const res = await placementRoute.PUT(
      jsonRequest('http://t/x', 'PUT', {
        planId: plan.id,
        scheduleIds: [cls.id],
        scholarshipType: 'ECONOMIC',
        scholarshipNote: 'apoyo',
        isCompetitor: true,
      }),
      routeParams({ studentId: student.id }),
    )
    expect(res.status).toBe(200)

    const placed = await db.student.findUniqueOrThrow({ where: { id: student.id } })
    expect(placed.planId).toBe(plan.id)
    expect(placed.scholarshipType).toBe('ECONOMIC')
    expect(placed.isCompetitor).toBe(true)
    expect(await db.classEnrollment.count({ where: { studentId: student.id, classId: cls.id, status: 'ACTIVE' } })).toBe(1)

    // Quitar el horario lo marca como terminado.
    await placementRoute.PUT(
      jsonRequest('http://t/x', 'PUT', { planId: plan.id, scheduleIds: [], scholarshipType: 'NONE', isCompetitor: false }),
      routeParams({ studentId: student.id }),
    )
    const enrollment = await db.classEnrollment.findFirstOrThrow({ where: { studentId: student.id, classId: cls.id } })
    expect(enrollment.status).toBe('ENDED')
  })

  it('rechaza un plan de otra escuela (400)', async () => {
    const school = await createSchool('A')
    const other = await createSchool('B')
    const branch = await createBranch(school.id)
    await loginAs(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const foreignPlan = await createPlan({ schoolId: other.id })

    const res = await placementRoute.PUT(
      jsonRequest('http://t/x', 'PUT', { planId: foreignPlan.id, scheduleIds: [], scholarshipType: 'NONE', isCompetitor: false }),
      routeParams({ studentId: student.id }),
    )
    expect(res.status).toBe(400)
  })
})

// Fase 3 · F3-04 — Invitación con token de 7 días.
describe('F3-04 · invitar alumno', () => {
  it('genera una invitación de 7 días para un alumno con correo', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAs(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    await db.student.update({ where: { id: student.id }, data: { email: 'ana@test.dev' } })

    const res = await inviteRoute.POST(
      new NextRequest('http://t/x', { method: 'POST' }),
      routeParams({ studentId: student.id }),
    )

    expect(res.status).toBe(200)
    const body = await readJson<{ ok: boolean; invitationUrl?: string }>(res)
    expect(body.ok).toBe(true)
    expect(body.invitationUrl).toBeTruthy()

    const token = await db.studentInvitationToken.findFirstOrThrow({ where: { studentId: student.id } })
    const daysToExpiry = (token.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    expect(daysToExpiry).toBeGreaterThan(6.9)
    expect(daysToExpiry).toBeLessThan(7.1)
  })

  it('rechaza invitar a un alumno que ya tiene cuenta (409)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAs(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const account = await db.user.create({ data: { email: `acc-${randomUUID()}@test.dev`, roles: ['STUDENT'] } })
    await db.student.update({ where: { id: student.id }, data: { email: 'ana@test.dev', userId: account.id } })

    const res = await inviteRoute.POST(new NextRequest('http://t/x', { method: 'POST' }), routeParams({ studentId: student.id }))
    expect(res.status).toBe(409)
  })
})

// Fase 3 · F3-05 — Asignación masiva de katas (INV-03: solo agrega, idempotente).
describe('F3-05 · asignación masiva de katas', () => {
  it('asigna y es idempotente (no duplica ni borra)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAs(school.id)
    const t1 = await createTechnique('Kata 1', school.id)
    const t2 = await createTechnique('Kata 2', school.id)
    const s1 = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const s2 = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Beto', lastName: 'Dos' })
    const body = { techniqueIds: [t1.id, t2.id], targets: [{ kind: 'STUDENT', studentIds: [s1.id, s2.id] }] }

    const first = await bulkKataRoute.POST(jsonRequest('http://t/x', 'POST', body))
    expect(first.status).toBe(200)
    expect(await readJson<{ linksAdded: number }>(first)).toEqual(expect.objectContaining({ linksAdded: 4 }))

    const second = await bulkKataRoute.POST(jsonRequest('http://t/x', 'POST', body))
    expect(await readJson<{ linksAdded: number }>(second)).toEqual(expect.objectContaining({ linksAdded: 0 }))
    expect(await db.studentTechnique.count()).toBe(4)
  })

  it('rechaza técnicas de otra escuela (400)', async () => {
    const school = await createSchool('A')
    const other = await createSchool('B')
    const branch = await createBranch(school.id)
    await loginAs(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const foreign = await createTechnique('Ajena', other.id)

    const res = await bulkKataRoute.POST(
      jsonRequest('http://t/x', 'POST', { techniqueIds: [foreign.id], targets: [{ kind: 'STUDENT', studentIds: [student.id] }] }),
    )
    expect(res.status).toBe(400)
  })
})

// Fase 3 · F3-08 — Aislamiento por escuela (INV-06).
describe('F3-08 · aislamiento por escuela', () => {
  it('no edita un alumno de otra escuela (404)', async () => {
    const school = await createSchool('A')
    const other = await createSchool('B')
    const otherBranch = await createBranch(other.id)
    await loginAs(school.id)
    const foreign = await createStudent({ schoolId: other.id, branchId: otherBranch.id, firstName: 'Ajeno', lastName: 'X' })

    const res = await studentItemRoute.PATCH(jsonRequest('http://t/x', 'PATCH', { firstName: 'Hack' }), routeParams({ studentId: foreign.id }))
    expect(res.status).toBe(404)
  })
})
