import { beforeEach, describe, expect, it } from 'vitest'

const { db, resetDb } = await import('./db')
const {
  createSchool,
  createBranch,
  createUser,
  createStudent,
  createStudentAccount,
  createPlan,
  createClass,
} = await import('./fixtures')
const { getAdminDashboardSummary, getAdminStudents, getAdminAttendanceRoster } = await import(
  '@/lib/dashboard/admin-queries'
)

beforeEach(resetDb)

async function setupSchool(name: string) {
  const school = await createSchool(name)
  const branch = await createBranch(school.id)
  const admin = await createUser({
    email: `admin-${name.replace(/\s+/g, '-').toLowerCase()}@test.dev`,
    roles: ['SCHOOL_ADMIN'],
    schoolId: school.id,
    branchId: branch.id,
  })
  const plan = await createPlan({ schoolId: school.id })
  const klass = await createClass({ branchId: branch.id })
  return { school, branch, admin, plan, klass }
}

describe('UX-B5.1 · pendientes de Hoy', () => {
  it('cuenta solo activos no excluidos y el filtro de Alumnos devuelve el mismo número', async () => {
    const a = await setupSchool('Escuela A')
    const b = await setupSchool('Escuela B')

    // Activo con plan y horario: no es pendiente.
    const completo = await createStudent({ schoolId: a.school.id, branchId: a.branch.id, firstName: 'Completo', lastName: 'A' })
    await db.student.update({ where: { id: completo.id }, data: { planId: a.plan.id } })
    await db.classEnrollment.create({ data: { classId: a.klass.id, studentId: completo.id, status: 'ACTIVE' } })

    // Activo sin plan, con horario: cuenta en "sin plan".
    const sinPlan = await createStudent({ schoolId: a.school.id, branchId: a.branch.id, firstName: 'SinPlan', lastName: 'A' })
    await db.classEnrollment.create({ data: { classId: a.klass.id, studentId: sinPlan.id, status: 'ACTIVE' } })

    // Activo con plan, sin horario: cuenta en "sin horario".
    const sinHorario = await createStudent({ schoolId: a.school.id, branchId: a.branch.id, firstName: 'SinHorario', lastName: 'A' })
    await db.student.update({ where: { id: sinHorario.id }, data: { planId: a.plan.id } })

    // Instructor con expediente y sin plan: SÍ cuenta (no se excluye por rol).
    await createStudentAccount({
      schoolId: a.school.id,
      branchId: a.branch.id,
      roles: ['INSTRUCTOR'],
    })

    // Inactivo sin plan ni horario: no cuenta.
    const inactivo = await createStudent({ schoolId: a.school.id, branchId: a.branch.id, firstName: 'Inactivo', lastName: 'A' })
    await db.student.update({ where: { id: inactivo.id }, data: { status: 'INACTIVE' } })

    // Owner marcado: no cuenta, aunque esté activo y sin plan/horario.
    const owner = await createUser({
      email: 'owner-a@test.dev',
      roles: ['SUPERADMIN', 'SCHOOL_ADMIN', 'INSTRUCTOR', 'STUDENT'],
      schoolId: a.school.id,
      branchId: a.branch.id,
    })
    await db.student.create({
      data: {
        userId: owner.id,
        schoolId: a.school.id,
        branchId: a.branch.id,
        firstName: 'Sensei',
        lastName: 'Owner',
        dateOfBirth: new Date('1990-01-01T00:00:00Z'),
        excludeFromPendingCounts: true,
      },
    })

    // Escuela B: no debe colarse en A.
    await createStudent({ schoolId: b.school.id, branchId: b.branch.id, firstName: 'Beto', lastName: 'B' })

    const summaryA = await getAdminDashboardSummary(a.admin.id)
    const studentsA = await getAdminStudents(a.admin.id)
    expect(summaryA).not.toBeNull()
    expect(studentsA).not.toBeNull()
    expect(summaryA!.pendingCases.noPlan).toBe(2) // SinPlan + instructor
    expect(summaryA!.pendingCases.noSchedule).toBe(2) // SinHorario + instructor
    expect(
      studentsA!.filter((student) => student.countsForPending && student.needsPlan),
    ).toHaveLength(summaryA!.pendingCases.noPlan)
    expect(
      studentsA!.filter((student) => student.countsForPending && student.needsSchedule),
    ).toHaveLength(summaryA!.pendingCases.noSchedule)

    const summaryB = await getAdminDashboardSummary(b.admin.id)
    expect(summaryB!.pendingCases.noPlan).toBe(1)
    expect(summaryB!.pendingCases.noSchedule).toBe(1)
  })

  it('la fila de justificaciones cuenta lo mismo que el roster y enlaza a la más antigua', async () => {
    const a = await setupSchool('Escuela Justificaciones')
    const otraClase = await createClass({ branchId: a.branch.id, name: 'Clase Temprana', dayOfWeek: 3 })

    const student = await createStudent({ schoolId: a.school.id, branchId: a.branch.id, firstName: 'Alumno', lastName: 'Justifica' })
    await db.student.update({ where: { id: student.id }, data: { planId: a.plan.id } })
    await db.classEnrollment.create({ data: { classId: a.klass.id, studentId: student.id, status: 'ACTIVE' } })

    const fechaAntigua = '2026-10-19'
    const fechaReciente = '2026-10-21'

    // Dos pendientes en clases y fechas distintas. La más antigua debe ser el destino.
    await db.absenceJustification.create({
      data: {
        studentId: student.id,
        classId: a.klass.id,
        date: new Date(`${fechaReciente}T00:00:00.000Z`),
        reason: 'Trámite',
        status: 'PENDING',
        createdAt: new Date('2026-10-21T10:00:00.000Z'),
      },
    })
    await db.absenceJustification.create({
      data: {
        studentId: student.id,
        classId: otraClase.id,
        date: new Date(`${fechaAntigua}T00:00:00.000Z`),
        reason: 'Cita médica',
        status: 'PENDING',
        createdAt: new Date('2026-10-19T10:00:00.000Z'),
      },
    })

    const summary = await getAdminDashboardSummary(a.admin.id)
    expect(summary!.pendingCases.justifications).toBe(2)
    expect(summary!.pendingCases.oldestJustification).toEqual({
      classId: otraClase.id,
      date: fechaAntigua,
    })

    const rosterAntiguo = await getAdminAttendanceRoster(a.admin.id, otraClase.id, fechaAntigua)
    const rosterReciente = await getAdminAttendanceRoster(a.admin.id, a.klass.id, fechaReciente)
    expect(rosterAntiguo).not.toBeNull()
    expect(rosterReciente).not.toBeNull()
    expect(rosterAntiguo!.summary.justificationsPending).toBe(1)
    expect(rosterReciente!.summary.justificationsPending).toBe(1)
  })
})
