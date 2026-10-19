import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/auth', async () => {
  const mod = await import('./route-auth')
  return { auth: mod.authMock.auth }
})

// Integraciones externas: no se llaman en la prueba.
vi.mock('@/lib/integrations/n8n', () => ({ postToN8n: async () => {} }))
vi.mock('@/lib/pdf/carnet-data', () => ({ generateCarnetForStudent: async () => {} }))
vi.mock('@/lib/notifications/create', () => ({
  notifyAssignment: async () => {},
  notifySchoolStaff: async () => {},
  notifyReviewSubmitted: async () => {},
}))

const { db, resetDb } = await import('./db')
const { authMock } = await import('./route-auth')
const { jsonRequest, routeParams, readJson } = await import('./http')
const { createSchool, createBranch } = await import('./fixtures')

const convertRoute = await import('@/app/api/dashboard/admin/enrollments/[enrollmentId]/convert/route')

async function loginAsAdmin(schoolId: string | null) {
  const admin = await db.user.create({ data: { email: `admin-${randomUUID()}@test.dev`, roles: ['SCHOOL_ADMIN'], schoolId } })
  authMock.setUser(admin.id, { roles: ['SCHOOL_ADMIN'], schoolId })
  return admin
}

async function makeEnrollment(schoolId: string, branchId: string) {
  return db.enrollment.create({
    data: { origin: 'FORM', schoolId, branchId, contactEmail: `fam-${randomUUID()}@test.dev`, status: 'PENDING' },
    select: { id: true },
  })
}

const baseBody = { contactPhone: null, medicalInfo: null, emergencyContact: null }

beforeEach(async () => {
  await resetDb()
  authMock.setUser(null)
})

// Fase 3 · F3-07 — Conversión de inscripción a alumno.
describe('F3-07 · convertir inscripción en alumno', () => {
  it('crea el expediente con el grado inicial y marca la inscripción como inscrita', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsAdmin(school.id)
    await db.beltRank.create({ data: { program: 'ADULT', name: 'Blanco', order: 1, schoolId: school.id } })
    const enrollment = await makeEnrollment(school.id, branch.id)

    const res = await convertRoute.POST(
      jsonRequest('http://t/x', 'POST', { firstName: 'Ana', lastName: 'Uno', dateOfBirth: '1990-05-01', ...baseBody }),
      routeParams({ enrollmentId: enrollment.id }),
    )

    expect(res.status).toBe(200)
    const body = await readJson<{ studentId: string; rankAutoAssigned: boolean; declaredKyu: string | null }>(res)
    expect(body.rankAutoAssigned).toBe(false)
    expect(body.declaredKyu).toBeNull()

    const student = await db.student.findUniqueOrThrow({ where: { id: body.studentId } })
    expect(student.schoolId).toBe(school.id)
    expect(student.branchId).toBe(branch.id)
    expect(student.currentRank).toBe('Blanco')

    const updatedEnrollment = await db.enrollment.findUniqueOrThrow({ where: { id: enrollment.id } })
    expect(updatedEnrollment.status).toBe('ENROLLED')
  })

  it('respeta el grado declarado en el formulario (Kyu previo)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsAdmin(school.id)
    await db.beltRank.create({ data: { program: 'ADULT', name: 'Blanco', order: 1, schoolId: school.id } })
    await db.beltRank.create({ data: { program: 'ADULT', name: 'Naranja', order: 3, kyuDan: '9TH KYU', schoolId: school.id } })
    const enrollment = await makeEnrollment(school.id, branch.id)
    const applicant = await db.enrollmentApplicant.create({
      data: {
        enrollmentId: enrollment.id,
        name: 'Hijo Uno',
        dateOfBirth: new Date('1990-05-01T00:00:00.000Z'),
        profileData: { haPracticadoKarate: true, kyu: '9TH KYU' },
      },
      select: { id: true },
    })

    const res = await convertRoute.POST(
      jsonRequest('http://t/x', 'POST', {
        applicantId: applicant.id,
        firstName: 'Hijo',
        lastName: 'Uno',
        dateOfBirth: '1990-05-01',
        ...baseBody,
      }),
      routeParams({ enrollmentId: enrollment.id }),
    )

    expect(res.status).toBe(200)
    const body = await readJson<{ studentId: string; rankAutoAssigned: boolean; declaredKyu: string | null }>(res)
    expect(body.rankAutoAssigned).toBe(true)
    expect(body.declaredKyu).toBe('9TH KYU')

    const student = await db.student.findUniqueOrThrow({ where: { id: body.studentId } })
    expect(student.currentRank).toBe('Naranja')
  })

  it('no convierte inscripciones de otra escuela (400 por no encontrada)', async () => {
    const school = await createSchool('A')
    const other = await createSchool('B')
    const otherBranch = await createBranch(other.id)
    await loginAsAdmin(school.id)
    const foreign = await makeEnrollment(other.id, otherBranch.id)

    const res = await convertRoute.POST(
      jsonRequest('http://t/x', 'POST', { firstName: 'Ana', lastName: 'Uno', dateOfBirth: '1990-05-01', ...baseBody }),
      routeParams({ enrollmentId: foreign.id }),
    )
    // La inscripción no pertenece al alcance → no se encuentra (400 datos) o 409 sin escuela; el expediente no se crea.
    expect(res.status).not.toBe(200)
    expect(await db.student.count()).toBe(0)
  })
})
