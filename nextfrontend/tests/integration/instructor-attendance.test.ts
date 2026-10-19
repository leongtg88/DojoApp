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
const { createSchool, createBranch, createClass, createStudent, createUser } = await import('./fixtures')

const attendanceRoute = await import('@/app/api/dashboard/instructor/attendance/route')
const justificationRoute = await import('@/app/api/dashboard/instructor/attendance/justification/[justificationId]/route')
const searchRoute = await import('@/app/api/dashboard/instructor/students/search/route')

const dayKey = (offsetDays = 0) => new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

async function loginAsInstructor(schoolId: string) {
  const instructor = await createUser({ email: `i-${randomUUID()}@test.dev`, roles: ['INSTRUCTOR'], schoolId })
  authMock.setUser(instructor.id, { roles: ['INSTRUCTOR'], schoolId })
  return instructor
}

beforeEach(async () => {
  await resetDb()
  authMock.setUser(null)
})

// Fase 6 · F6-01 — Pase de lista del instructor.
describe('F6-01 · pase de lista', () => {
  it('guarda la asistencia de la clase propia (presente/ausente)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const instructor = await loginAsInstructor(school.id)
    const scheduledClass = await createClass({ branchId: branch.id, instructorId: instructor.id })
    const present = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const absent = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Beto', lastName: 'Dos' })
    await db.classEnrollment.createMany({
      data: [
        { classId: scheduledClass.id, studentId: present.id, status: 'ACTIVE' },
        { classId: scheduledClass.id, studentId: absent.id, status: 'ACTIVE' },
      ],
    })

    const res = await attendanceRoute.POST(
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
    const attendances = await db.attendance.findMany()
    expect(attendances).toHaveLength(2)
    expect(attendances.find((row) => row.studentId === present.id)?.status).toBe('CONFIRMED')
    expect(attendances.find((row) => row.studentId === absent.id)?.status).toBe('ABSENT')
    expect(await db.classSession.count({ where: { classId: scheduledClass.id } })).toBe(1)
  })
})

// Fase 6 · F6-02 — El instructor solo valida sus propios horarios.
describe('F6-02 · solo lectura de horarios ajenos', () => {
  it('rechaza guardar el pase de lista de una clase que no le pertenece (403)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsInstructor(school.id)
    const otherInstructor = await createUser({ email: `i2-${randomUUID()}@test.dev`, roles: ['INSTRUCTOR'], schoolId: school.id })
    const foreignClass = await createClass({ branchId: branch.id, instructorId: otherInstructor.id })

    const res = await attendanceRoute.POST(
      jsonRequest('http://t/x', 'POST', { classId: foreignClass.id, date: dayKey(), records: [] }),
    )
    expect(res.status).toBe(403)
  })
})

// Fase 6 · F6-03 — Buscar alumnos para agregarlos al tatami.
describe('F6-03 · buscar alumno para el tatami', () => {
  it('encuentra alumnos activos de la escuela y exige 2+ caracteres', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsInstructor(school.id)
    const ana = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Kurosawa' })
    await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Beto', lastName: 'Tanaka' })

    const found = await searchRoute.GET(new NextRequest('http://t/x?q=Ana'))
    expect(found.status).toBe(200)
    const body = await readJson<{ students: { id: string }[] }>(found)
    expect(body.students.map((student) => student.id)).toContain(ana.id)

    const short = await searchRoute.GET(new NextRequest('http://t/x?q=A'))
    expect((await readJson<{ students: unknown[] }>(short)).students).toEqual([])
  })
})

// Fase 6 · F6-04 — Revisar justificaciones de inasistencia.
describe('F6-04 · justificaciones', () => {
  it('aprueba una justificación de su clase y genera la asistencia justificada', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const instructor = await loginAsInstructor(school.id)
    const scheduledClass = await createClass({ branchId: branch.id, instructorId: instructor.id })
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const justification = await db.absenceJustification.create({
      data: { studentId: student.id, classId: scheduledClass.id, date: new Date(`${dayKey()}T00:00:00.000Z`), reason: 'enfermedad' },
      select: { id: true },
    })

    const res = await justificationRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { action: 'approve' }),
      routeParams({ justificationId: justification.id }),
    )

    expect(res.status).toBe(200)
    expect((await db.absenceJustification.findUniqueOrThrow({ where: { id: justification.id } })).status).toBe('APPROVED')
    const attendance = await db.attendance.findFirstOrThrow({ where: { studentId: student.id } })
    expect(attendance.status).toBe('JUSTIFIED')
  })

  it('rechaza revisar una justificación de una clase ajena (403) y una inexistente (404)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsInstructor(school.id)
    const otherInstructor = await createUser({ email: `i2-${randomUUID()}@test.dev`, roles: ['INSTRUCTOR'], schoolId: school.id })
    const foreignClass = await createClass({ branchId: branch.id, instructorId: otherInstructor.id })
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const foreignJustification = await db.absenceJustification.create({
      data: { studentId: student.id, classId: foreignClass.id, date: new Date(`${dayKey()}T00:00:00.000Z`), reason: 'viaje' },
      select: { id: true },
    })

    const forbidden = await justificationRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { action: 'reject' }),
      routeParams({ justificationId: foreignJustification.id }),
    )
    expect(forbidden.status).toBe(403)

    const notFound = await justificationRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { action: 'approve' }),
      routeParams({ justificationId: 'no-existe' }),
    )
    expect(notFound.status).toBe(404)
  })
})
