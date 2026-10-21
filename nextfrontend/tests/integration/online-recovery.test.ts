import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/auth', async () => {
  const mod = await import('./route-auth')
  return { auth: mod.authMock.auth }
})

vi.mock('@/lib/notifications/create', () => ({
  notifyAssignment: async () => {},
  notifyUser: async () => {},
  notifySchoolStaff: async () => {},
  notifyReviewSubmitted: async () => {},
}))

const { db, resetDb } = await import('./db')
const { authMock } = await import('./route-auth')
const { jsonRequest, routeParams, readJson } = await import('./http')
const { createSchool, createBranch, createClass, createStudent, createUser } = await import('./fixtures')

const recoveryRoute = await import('@/app/api/dashboard/attendance/recovery/route')
const recoveryDetailRoute = await import('@/app/api/dashboard/attendance/recovery/[recoveryId]/route')
const { saveClassAttendance } = await import('@/lib/dashboard/attendance-roster')

const dayKey = (offsetDays = 0) => new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
const futureIso = (days = 7) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

async function setupStudentWithAbsence() {
  const school = await createSchool()
  const branch = await createBranch(school.id)
  const instructor = await createUser({ email: `i-${randomUUID()}@test.dev`, roles: ['INSTRUCTOR'], schoolId: school.id })
  const admin = await createUser({ email: `a-${randomUUID()}@test.dev`, roles: ['SCHOOL_ADMIN'], schoolId: school.id })
  const scheduledClass = await createClass({ branchId: branch.id, instructorId: instructor.id })
  const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })

  await db.classEnrollment.create({
    data: { classId: scheduledClass.id, studentId: student.id, status: 'ACTIVE' },
  })

  const absence = await db.attendance.create({
    data: {
      studentId: student.id,
      classId: scheduledClass.id,
      date: new Date(`${dayKey(-10)}T16:00:00.000Z`),
      present: false,
      status: 'ABSENT',
      sessionType: 'class',
      hoursTrained: 0,
    },
    select: { id: true },
  })

  authMock.setUser(instructor.id, { roles: ['INSTRUCTOR'], schoolId: school.id })

  return { school, branch, instructor, admin, scheduledClass, student, absence }
}

beforeEach(async () => {
  await resetDb()
  authMock.setUser(null)
})

describe('reposición online de 35 min', () => {
  it('agenda, completa y repone la falta con 0.58 h de tatami', async () => {
    const { absence, instructor } = await setupStudentWithAbsence()

    const created = await recoveryRoute.POST(
      jsonRequest('http://t/x', 'POST', {
        absenceId: absence.id,
        scheduledAt: futureIso(),
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        notes: 'Repasar kata',
      }),
    )

    expect(created.status).toBe(201)
    const createdBody = await readJson<{ recovery: { id: string; status: string; instructorId: string; durationMinutes: number } }>(created)
    expect(createdBody.recovery.status).toBe('SCHEDULED')
    expect(createdBody.recovery.instructorId).toBe(instructor.id)
    expect(createdBody.recovery.durationMinutes).toBe(35)

    const completed = await recoveryDetailRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { action: 'complete' }),
      routeParams({ recoveryId: createdBody.recovery.id }),
    )

    expect(completed.status).toBe(200)

    const absenceRow = await db.attendance.findUniqueOrThrow({ where: { id: absence.id } })
    expect(absenceRow.recoveredById).not.toBeNull()

    const makeUp = await db.attendance.findUniqueOrThrow({ where: { id: absenceRow.recoveredById! } })
    expect(makeUp.present).toBe(true)
    expect(makeUp.status).toBe('CONFIRMED')
    expect(makeUp.sessionType).toBe('online_recovery')
    expect(makeUp.hoursTrained).toBeCloseTo(0.58, 2)

    const recovery = await db.onlineRecovery.findUniqueOrThrow({ where: { id: createdBody.recovery.id } })
    expect(recovery.status).toBe('COMPLETED')
    expect(recovery.attendanceId).toBe(makeUp.id)
  })

  it('no permite completar dos veces la misma falta', async () => {
    const { absence } = await setupStudentWithAbsence()

    const created = await recoveryRoute.POST(
      jsonRequest('http://t/x', 'POST', { absenceId: absence.id, scheduledAt: futureIso() }),
    )
    const body = await readJson<{ recovery: { id: string } }>(created)

    const first = await recoveryDetailRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { action: 'complete' }),
      routeParams({ recoveryId: body.recovery.id }),
    )
    expect(first.status).toBe(200)

    const second = await recoveryDetailRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { action: 'complete' }),
      routeParams({ recoveryId: body.recovery.id }),
    )
    expect(second.status).toBe(409)
  })

  it('solo el admin informa el costo de la reposición', async () => {
    const { absence, admin, school } = await setupStudentWithAbsence()

    const created = await recoveryRoute.POST(
      jsonRequest('http://t/x', 'POST', { absenceId: absence.id, scheduledAt: futureIso() }),
    )
    const body = await readJson<{ recovery: { id: string } }>(created)

    const forbidden = await recoveryDetailRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { action: 'cost', costAmount: 500, costCurrency: 'DOP' }),
      routeParams({ recoveryId: body.recovery.id }),
    )
    expect(forbidden.status).toBe(403)

    authMock.setUser(admin.id, { roles: ['SCHOOL_ADMIN'], schoolId: school.id })

    const allowed = await recoveryDetailRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { action: 'cost', costAmount: 750, costCurrency: 'DOP', costNote: 'Tarifa acordada' }),
      routeParams({ recoveryId: body.recovery.id }),
    )
    expect(allowed.status).toBe(200)

    const recovery = await db.onlineRecovery.findUniqueOrThrow({ where: { id: body.recovery.id } })
    expect(recovery.costAmount?.toNumber()).toBe(750)
    expect(recovery.costInformedAt).not.toBeNull()
  })

  it('marca no-show y permite reprogramar sin reponer la falta', async () => {
    const { absence } = await setupStudentWithAbsence()

    const created = await recoveryRoute.POST(
      jsonRequest('http://t/x', 'POST', { absenceId: absence.id, scheduledAt: futureIso() }),
    )
    const body = await readJson<{ recovery: { id: string } }>(created)

    const noShow = await recoveryDetailRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { action: 'no-show' }),
      routeParams({ recoveryId: body.recovery.id }),
    )
    expect(noShow.status).toBe(200)

    const afterNoShow = await db.attendance.findUniqueOrThrow({ where: { id: absence.id } })
    expect(afterNoShow.recoveredById).toBeNull()

    const rescheduled = await recoveryDetailRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { action: 'reschedule', scheduledAt: futureIso(10) }),
      routeParams({ recoveryId: body.recovery.id }),
    )
    expect(rescheduled.status).toBe(200)

    const recovery = await db.onlineRecovery.findUniqueOrThrow({ where: { id: body.recovery.id } })
    expect(recovery.status).toBe('SCHEDULED')
  })

  it('un instructor de otra escuela no puede agendar ni ver faltas ajenas', async () => {
    const { absence } = await setupStudentWithAbsence()
    const otherSchool = await createSchool('Otra escuela')
    const otherBranch = await createBranch(otherSchool.id)
    const otherInstructor = await createUser({ email: `i2-${randomUUID()}@test.dev`, roles: ['INSTRUCTOR'], schoolId: otherSchool.id })
    await createClass({ branchId: otherBranch.id, instructorId: otherInstructor.id })

    authMock.setUser(otherInstructor.id, { roles: ['INSTRUCTOR'], schoolId: otherSchool.id })

    const create = await recoveryRoute.POST(
      jsonRequest('http://t/x', 'POST', { absenceId: absence.id, scheduledAt: futureIso() }),
    )
    expect(create.status).toBe(404)

    const list = await recoveryRoute.GET(new Request('http://t/x'))
    expect(list.status).toBe(200)
    const body = await readJson<{ recoveries: unknown[]; candidates: unknown[] }>(list)
    expect(body.recoveries).toEqual([])
    expect(body.candidates).toEqual([])
  })

  it('cancela la clase online programada cuando la falta se repone presencialmente', async () => {
    const { absence, scheduledClass, student, instructor } = await setupStudentWithAbsence()

    const created = await recoveryRoute.POST(
      jsonRequest('http://t/x', 'POST', { absenceId: absence.id, scheduledAt: futureIso() }),
    )
    const body = await readJson<{ recovery: { id: string } }>(created)

    await saveClassAttendance({
      classId: scheduledClass.id,
      date: dayKey(),
      records: [{ studentId: student.id, present: true, notes: null }],
      confirmedById: instructor.id,
      defaultHours: 1,
      enrolledStudentIds: new Set(),
    })

    const recovery = await db.onlineRecovery.findUniqueOrThrow({ where: { id: body.recovery.id } })
    expect(recovery.status).toBe('CANCELLED')

    const absenceRow = await db.attendance.findUniqueOrThrow({ where: { id: absence.id } })
    expect(absenceRow.recoveredById).not.toBeNull()
  })
})
