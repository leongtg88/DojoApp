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
const { createSchool, createBranch, createClass, createStudent, createUser } = await import('./fixtures')

const studentsRoute = await import('@/app/api/dashboard/admin/students/route')
const attendanceRoute = await import('@/app/api/dashboard/admin/attendance/route')
const reviewsRoute = await import('@/app/api/dashboard/admin/reviews/route')
const instructorAttendanceRoute = await import('@/app/api/dashboard/instructor/attendance/[attendanceId]/route')
const confirmAllRoute = await import('@/app/api/dashboard/instructor/attendance/confirm-all/route')

async function loginAsAdmin(schoolId: string) {
  const admin = await createUser({ email: `a-${randomUUID()}@test.dev`, roles: ['SCHOOL_ADMIN'], schoolId })
  authMock.setUser(admin.id, { roles: ['SCHOOL_ADMIN'], schoolId })
  return admin
}

async function loginAsInstructor(schoolId: string) {
  const instructor = await createUser({ email: `i-${randomUUID()}@test.dev`, roles: ['INSTRUCTOR'], schoolId })
  authMock.setUser(instructor.id, { roles: ['INSTRUCTOR'], schoolId })
  return instructor
}

beforeEach(async () => {
  await resetDb()
  authMock.setUser(null)
})

// Aislamiento por escuela (INV-06): el admin de A nunca ve datos de B.
describe('aislamiento por escuela · listados del admin', () => {
  it('el padrón de alumnos solo devuelve la propia escuela', async () => {
    const schoolA = await createSchool('A')
    const branchA = await createBranch(schoolA.id)
    const schoolB = await createSchool('B')
    const branchB = await createBranch(schoolB.id)
    await loginAsAdmin(schoolA.id)
    const own = await createStudent({ schoolId: schoolA.id, branchId: branchA.id, firstName: 'Propia', lastName: 'A' })
    await createStudent({ schoolId: schoolB.id, branchId: branchB.id, firstName: 'Ajena', lastName: 'B' })

    const res = await studentsRoute.GET()
    const body = await readJson<{ students: { id: string }[] }>(res)

    expect(body.students.map((student) => student.id)).toEqual([own.id])
  })

  it('la asistencia solo devuelve la propia escuela', async () => {
    const schoolA = await createSchool('A')
    const branchA = await createBranch(schoolA.id)
    const schoolB = await createSchool('B')
    const branchB = await createBranch(schoolB.id)
    await loginAsAdmin(schoolA.id)
    const ownStudent = await createStudent({ schoolId: schoolA.id, branchId: branchA.id, firstName: 'Propia', lastName: 'A' })
    const otherStudent = await createStudent({ schoolId: schoolB.id, branchId: branchB.id, firstName: 'Ajena', lastName: 'B' })
    await db.attendance.create({ data: { studentId: ownStudent.id, date: new Date(), present: true, status: 'PENDING', hoursTrained: 1 } })
    await db.attendance.create({ data: { studentId: otherStudent.id, date: new Date(), present: true, status: 'PENDING', hoursTrained: 1 } })

    const res = await attendanceRoute.GET(new Request('http://t/api'))
    const body = await readJson<{ records: { student: { id: string } }[] }>(res)

    expect(body.records.map((record) => record.student.id)).toEqual([ownStudent.id])
  })

  it('las reseñas solo devuelven la propia escuela', async () => {
    const schoolA = await createSchool('A')
    const schoolB = await createSchool('B')
    await loginAsAdmin(schoolA.id)
    const own = await db.review.create({ data: { schoolId: schoolA.id, authorName: 'Propia', message: 'texto suficiente', rating: 5 }, select: { id: true } })
    await db.review.create({ data: { schoolId: schoolB.id, authorName: 'Ajena', message: 'texto suficiente', rating: 5 } })

    const res = await reviewsRoute.GET()
    const body = await readJson<{ reviews: { id: string }[] }>(res)

    expect(body.reviews.map((review) => review.id)).toEqual([own.id])
  })
})

// Endpoints del instructor sin UI (InstructorAttendanceBoard): deben respetar la propiedad.
describe('instructor · endpoints de rectificación y confirmación masiva', () => {
  it('PATCH /instructor/attendance/[id] rechaza un registro de una clase ajena (403)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const owner = await createUser({ email: `i-${randomUUID()}@test.dev`, roles: ['INSTRUCTOR'], schoolId: school.id })
    const other = await createClass({ branchId: branch.id, instructorId: owner.id })
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    await db.classEnrollment.create({ data: { classId: other.id, studentId: student.id, status: 'ACTIVE' } })
    const attendance = await db.attendance.create({
      data: { studentId: student.id, date: new Date(), present: true, status: 'PENDING', hoursTrained: 1, sessionId: null },
      select: { id: true },
    })
    // Sesión de un instructor que NO es dueño de la clase.
    await loginAsInstructor(school.id)

    const res = await instructorAttendanceRoute.PATCH(
      jsonRequest('http://t/api', 'PATCH', { action: 'confirm' }),
      routeParams({ attendanceId: attendance.id }),
    )
    expect(res.status).toBe(403)
    expect((await db.attendance.findUniqueOrThrow({ where: { id: attendance.id } })).status).toBe('PENDING')
  })

  it('POST /instructor/attendance/confirm-all solo confirma los alumnos propios', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const instructor = await loginAsInstructor(school.id)
    const ownClass = await createClass({ branchId: branch.id, instructorId: instructor.id })
    const foreignOwner = await createUser({ email: `i2-${randomUUID()}@test.dev`, roles: ['INSTRUCTOR'], schoolId: school.id })
    const foreignClass = await createClass({ branchId: branch.id, instructorId: foreignOwner.id })
    const ownStudent = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Propia', lastName: 'A' })
    const foreignStudent = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ajena', lastName: 'B' })
    await db.classEnrollment.createMany({
      data: [
        { classId: ownClass.id, studentId: ownStudent.id, status: 'ACTIVE' },
        { classId: foreignClass.id, studentId: foreignStudent.id, status: 'ACTIVE' },
      ],
    })
    const ownAttendance = await db.attendance.create({ data: { studentId: ownStudent.id, date: new Date(), present: true, status: 'PENDING', hoursTrained: 1 }, select: { id: true } })
    const foreignAttendance = await db.attendance.create({ data: { studentId: foreignStudent.id, date: new Date(), present: true, status: 'PENDING', hoursTrained: 1 }, select: { id: true } })

    const res = await confirmAllRoute.POST(jsonRequest('http://t/api', 'POST', {}))

    expect(res.status).toBe(200)
    expect((await db.attendance.findUniqueOrThrow({ where: { id: ownAttendance.id } })).status).toBe('CONFIRMED')
    expect((await db.attendance.findUniqueOrThrow({ where: { id: foreignAttendance.id } })).status).toBe('PENDING')
  })
})
