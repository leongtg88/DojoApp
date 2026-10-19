import { beforeEach, describe, expect, it } from 'vitest'

const { db, resetDb } = await import('./db')
const { createSchool, createBranch, createClass, createStudent, createUser } = await import('./fixtures')
const { ensureClassAbsences } = await import('@/lib/dashboard/attendance-absences')
const { santoDomingoNoon } = await import('@/lib/dashboard/schedule-utils')

// Fecha pasada (la ventana de punch de 7 días ya cerró).
const PAST_DATE = '2026-09-01'
const PAST_DAY_OF_WEEK = new Date(`${PAST_DATE}T00:00:00.000Z`).getUTCDay()

async function setup() {
  const school = await createSchool('Escuela A')
  const branch = await createBranch(school.id)
  const admin = await createUser({ email: `admin-${school.id}@test.dev`, roles: ['SCHOOL_ADMIN'], schoolId: school.id })
  return { school, branch, admin }
}

async function enrollStudent(classId: string, schoolId: string, branchId: string) {
  const student = await createStudent({ schoolId, branchId, firstName: 'Ana', lastName: 'Alumna' })
  await db.classEnrollment.create({ data: { classId, studentId: student.id, status: 'ACTIVE' } })
  return student
}

beforeEach(resetDb)

describe('ensureClassAbsences', () => {
  it('no hace nada si el usuario no tiene alcance admin', async () => {
    const { school, branch } = await setup()
    const teacher = await createUser({ email: 'profe@test.dev', roles: ['INSTRUCTOR'], schoolId: school.id })
    const scheduledClass = await createClass({ branchId: branch.id, dayOfWeek: PAST_DAY_OF_WEEK })
    await enrollStudent(scheduledClass.id, school.id, branch.id)

    await ensureClassAbsences(teacher.id, scheduledClass.id, PAST_DATE)

    expect(await db.attendance.count()).toBe(0)
  })

  it('no hace nada mientras la ventana de punch sigue abierta', async () => {
    const { school, branch, admin } = await setup()
    const scheduledClass = await createClass({ branchId: branch.id, dayOfWeek: PAST_DAY_OF_WEEK })
    await enrollStudent(scheduledClass.id, school.id, branch.id)
    const today = new Date().toISOString().slice(0, 10)

    await ensureClassAbsences(admin.id, scheduledClass.id, today)

    expect(await db.attendance.count()).toBe(0)
  })

  it('no hace nada si la clase no existe o es de otra escuela', async () => {
    const { admin } = await setup()
    const otherSchool = await createSchool('Escuela B')
    const otherBranch = await createBranch(otherSchool.id)
    const foreignClass = await createClass({ branchId: otherBranch.id, dayOfWeek: PAST_DAY_OF_WEEK })

    await ensureClassAbsences(admin.id, foreignClass.id, PAST_DATE)
    await ensureClassAbsences(admin.id, 'clase-inexistente', PAST_DATE)

    expect(await db.attendance.count()).toBe(0)
  })

  it('ignora las clases inactivas', async () => {
    const { school, branch, admin } = await setup()
    const inactiveClass = await createClass({ branchId: branch.id, dayOfWeek: PAST_DAY_OF_WEEK, active: false })
    await enrollStudent(inactiveClass.id, school.id, branch.id)

    await ensureClassAbsences(admin.id, inactiveClass.id, PAST_DATE)

    expect(await db.attendance.count()).toBe(0)
  })

  it('no marca falta si la clase no sesiona ese día de la semana y no hay sesión', async () => {
    const { school, branch, admin } = await setup()
    const wrongDay = (PAST_DAY_OF_WEEK + 1) % 7
    const scheduledClass = await createClass({ branchId: branch.id, dayOfWeek: wrongDay })
    await enrollStudent(scheduledClass.id, school.id, branch.id)

    await ensureClassAbsences(admin.id, scheduledClass.id, PAST_DATE)

    expect(await db.attendance.count()).toBe(0)
  })

  it('crea la falta (ABSENT) de los inscritos sin registro y es idempotente', async () => {
    const { school, branch, admin } = await setup()
    const scheduledClass = await createClass({ branchId: branch.id, dayOfWeek: PAST_DAY_OF_WEEK })
    const student = await enrollStudent(scheduledClass.id, school.id, branch.id)

    await ensureClassAbsences(admin.id, scheduledClass.id, PAST_DATE)

    const absences = await db.attendance.findMany()
    expect(absences).toHaveLength(1)
    expect(absences[0].studentId).toBe(student.id)
    expect(absences[0].status).toBe('ABSENT')
    expect(absences[0].present).toBe(false)
    expect(absences[0].hoursTrained).toBe(0)

    // Segunda pasada: no duplica.
    await ensureClassAbsences(admin.id, scheduledClass.id, PAST_DATE)
    expect(await db.attendance.count()).toBe(1)
  })

  it('no marca falta si el alumno tiene un punch del día', async () => {
    const { school, branch, admin } = await setup()
    const scheduledClass = await createClass({ branchId: branch.id, dayOfWeek: PAST_DAY_OF_WEEK })
    const student = await enrollStudent(scheduledClass.id, school.id, branch.id)
    await db.attendance.create({
      data: { studentId: student.id, sessionId: null, date: santoDomingoNoon(PAST_DATE), present: true, status: 'CONFIRMED' },
    })

    await ensureClassAbsences(admin.id, scheduledClass.id, PAST_DATE)

    expect(await db.attendance.count()).toBe(1)
    expect((await db.attendance.findFirstOrThrow()).status).toBe('CONFIRMED')
  })

  it('no marca falta si el alumno ya figura en el pase de lista de la sesión', async () => {
    const { school, branch, admin } = await setup()
    const scheduledClass = await createClass({ branchId: branch.id, dayOfWeek: PAST_DAY_OF_WEEK })
    const student = await enrollStudent(scheduledClass.id, school.id, branch.id)
    const session = await db.classSession.create({ data: { classId: scheduledClass.id, date: new Date(`${PAST_DATE}T00:00:00.000Z`) } })
    await db.attendance.create({
      data: { sessionId: session.id, studentId: student.id, present: true, status: 'CONFIRMED' },
    })

    await ensureClassAbsences(admin.id, scheduledClass.id, PAST_DATE)

    expect(await db.attendance.count()).toBe(1)
    expect((await db.attendance.findFirstOrThrow()).status).toBe('CONFIRMED')
  })

  it('no marca falta a alumnos inactivos', async () => {
    const { school, branch, admin } = await setup()
    const scheduledClass = await createClass({ branchId: branch.id, dayOfWeek: PAST_DAY_OF_WEEK })
    const student = await enrollStudent(scheduledClass.id, school.id, branch.id)
    await db.student.update({ where: { id: student.id }, data: { status: 'INACTIVE' } })

    await ensureClassAbsences(admin.id, scheduledClass.id, PAST_DATE)

    expect(await db.attendance.count()).toBe(0)
  })
})
