import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/notifications/create', () => ({
  notifyAssignment: async () => {},
  notifySchoolStaff: async () => {},
  notifyReviewSubmitted: async () => {},
}))

const { db, resetDb } = await import('./db')
const { createSchool, createBranch, createStudent, createTechnique, createPlan, scopeFor } = await import('./fixtures')
const { assignTechniquesToTargets } = await import('@/lib/dashboard/technique-assign')
const { getStudentKataProgress } = await import('@/lib/dashboard/student-queries')

beforeEach(resetDb)

// Fase 4 · F4-02 — Progreso de grado/katas del alumno.
describe('F4-02 · getStudentKataProgress', () => {
  it('resuelve el grado actual, las katas requeridas y los cuatrimestres', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const blanco = await db.beltRank.create({
      data: { program: 'ADULT', name: 'Blanco', order: 1, schoolId: school.id, minMonths: 0, minAttendancePercent: 80 },
      select: { id: true },
    })
    await db.beltRank.create({ data: { program: 'ADULT', name: 'Amarillo', order: 2, schoolId: school.id } })
    const kata1 = await createTechnique('Kata Ichi', school.id)
    const kata2 = await createTechnique('Kata Ni', school.id)
    await db.beltRankKata.createMany({
      data: [
        { beltRankId: blanco.id, kataId: kata1.id, order: 1 },
        { beltRankId: blanco.id, kataId: kata2.id, order: 2 },
      ],
    })
    const plan = await createPlan({ schoolId: school.id, name: 'Plan Test', monthlyHours: 8 })

    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    await db.student.update({
      where: { id: student.id },
      data: {
        currentRank: 'Blanco',
        currentRankId: blanco.id,
        planId: plan.id,
        dateOfBirth: new Date('1990-05-01T00:00:00.000Z'),
        enrollmentDate: new Date('2025-01-01T00:00:00.000Z'),
      },
    })

    await assignTechniquesToTargets({
      scope: scopeFor(school.id, branch.id),
      techniqueIds: [kata1.id, kata2.id],
      targets: [{ kind: 'STUDENT', studentIds: [student.id] }],
    })
    await db.studentTechnique.updateMany({
      where: { studentId: student.id, techniqueId: kata1.id },
      data: { approved: true, approvedAt: new Date('2026-01-01T00:00:00.000Z') },
    })

    const result = await getStudentKataProgress(student.id)
    expect(result).not.toBeNull()

    const { grado, katas } = result!
    expect(grado.currentRankName).toBe('Blanco')
    expect(grado.nextRankName).toBe('Amarillo')
    expect(grado.requiredKatas).toBe(2)
    expect(grado.approvedKatas).toBe(1)
    expect(grado.cuatrimestres.length).toBeGreaterThan(0)
    expect(grado.monthly?.planName).toBe('Plan Test')
    expect(grado.isEligible).toBe(false)

    const required = katas.filter((kata) => kata.requiredForGrade)
    expect(required).toHaveLength(2)
    expect(katas.find((kata) => kata.id === kata1.id)?.status).toBe('APPROVED')
    expect(katas.find((kata) => kata.id === kata2.id)?.status).toBe('PENDING')
  })

  it('devuelve null si el alumno no existe', async () => {
    await expect(getStudentKataProgress('no-existe')).resolves.toBeNull()
  })
})
