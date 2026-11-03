import { beforeEach, describe, expect, it, vi } from 'vitest'
import { randomUUID } from 'node:crypto'
import { PracticePlace } from '@/lib/generated/prisma'

// Las notificaciones son best-effort y disparan WhatsApp/email: se neutralizan.
vi.mock('@/lib/notifications/create', () => ({
  notifyAssignment: async () => {},
  notifySchoolStaff: async () => {},
  notifyReviewSubmitted: async () => {},
}))

const { db, resetDb } = await import('./db')
const { createSchool, createBranch, createStudent, createTechnique, createUser, scopeFor } = await import('./fixtures')
const { assignTechniquesToTargets } = await import('@/lib/dashboard/technique-assign')
const { registerPracticeLogs } = await import('@/lib/dashboard/technique-reps')
const { getInstructorTechniqueReview } = await import('@/lib/dashboard/instructor-queries')

beforeEach(resetDb)

const DAY = 24 * 60 * 60 * 1000

async function setupCycle(category: 'KATA' | 'KIHON' = 'KATA') {
  const school = await createSchool()
  const branch = await createBranch(school.id)
  const instructor = await createUser({ email: `inst-${randomUUID()}@test.dev`, roles: ['INSTRUCTOR'], schoolId: school.id, name: 'Sensei' })
  const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
  const technique = await createTechnique(category === 'KATA' ? 'Kata' : 'Kihon', school.id, category)
  await assignTechniquesToTargets({
    scope: scopeFor(school.id, branch.id),
    techniqueIds: [technique.id],
    targets: [{ kind: 'STUDENT', studentIds: [student.id] }],
  })

  // Ancla la asignación en el pasado para que los logs registrados después
  // queden, sin ambigüedad, dentro del ciclo (evita carreras de milisegundos).
  const st = await db.studentTechnique.findFirstOrThrow({ where: { studentId: student.id, techniqueId: technique.id } })
  await db.studentTechnique.update({ where: { id: st.id }, data: { createdAt: new Date(Date.now() - 30 * DAY) } })

  return { school, instructor, student, technique }
}

async function cycleRow(instructorId: string, studentId: string) {
  const review = await getInstructorTechniqueReview(instructorId, studentId)
  return review!.techniques[0]
}

// Fase 1 · T6 — Ciclo de dominio técnico (integración).
describe('evaluation-cycle · integración', () => {
  it('una kata con 20 ejecuciones queda lista para evaluar', async () => {
    const { instructor, student, technique } = await setupCycle('KATA')
    await registerPracticeLogs(student.id, [{ techniqueId: technique.id, repetitions: 20, place: PracticePlace.DOJO }])

    const row = await cycleRow(instructor.id, student.id)
    expect(row.readyForEvaluation).toBe(true)
    expect(row.evaluationRecommended).toBe(true) // hay log en dojo
    expect(row.cycleReps).toBe(20)
    expect(row.cycleThreshold).toBe(20)
    expect(row.remainingReps).toBe(0)
    expect(row.cycleBlockedReason).toBeNull()
  })

  it('con 19 ejecuciones no está lista y falta 1', async () => {
    const { instructor, student, technique } = await setupCycle('KATA')
    await registerPracticeLogs(student.id, [{ techniqueId: technique.id, repetitions: 19, place: PracticePlace.DOJO }])

    const row = await cycleRow(instructor.id, student.id)
    expect(row.readyForEvaluation).toBe(false)
    expect(row.remainingReps).toBe(1)
    expect(row.cycleBlockedReason).toBe('REPS')
  })

  it('bloquea por cadencia si la última evaluación fue hace 3 días', async () => {
    const { instructor, student, technique } = await setupCycle('KATA')
    const now = new Date()
    const st = await db.studentTechnique.findFirstOrThrow({ where: { studentId: student.id, techniqueId: technique.id } })
    await db.techniqueEvaluation.create({
      data: { studentTechniqueId: st.id, score: 7, evaluatedBy: instructor.id, evaluatedAt: new Date(now.getTime() - 3 * DAY) },
    })
    await registerPracticeLogs(student.id, [
      { techniqueId: technique.id, repetitions: 20, place: PracticePlace.DOJO, date: new Date(now.getTime() - DAY) },
    ])

    const row = await cycleRow(instructor.id, student.id)
    expect(row.readyForEvaluation).toBe(false)
    expect(row.cycleReps).toBe(20)
    expect(row.cycleBlockedReason).toBe('CADENCE')
    expect(row.cycleDaysRemaining).toBe(4)
  })

  it('los logs libres no cuentan para el ciclo', async () => {
    const { school, instructor, student, technique } = await setupCycle('KATA')
    const freeKata = await createTechnique('Kata libre', school.id, 'KATA')
    await registerPracticeLogs(student.id, [{ techniqueId: freeKata.id, repetitions: 20, place: PracticePlace.DOJO }])

    const row = await cycleRow(instructor.id, student.id)
    expect(row.id).toBe(technique.id)
    expect(row.cycleReps).toBe(0)
    expect(row.readyForEvaluation).toBe(false)
  })

  it('guardar una evaluación reinicia el ciclo', async () => {
    const { instructor, student, technique } = await setupCycle('KATA')
    const now = new Date()
    await registerPracticeLogs(student.id, [
      { techniqueId: technique.id, repetitions: 20, place: PracticePlace.DOJO, date: new Date(now.getTime() - DAY) },
    ])

    const before = await cycleRow(instructor.id, student.id)
    expect(before.readyForEvaluation).toBe(true)

    const st = await db.studentTechnique.findFirstOrThrow({ where: { studentId: student.id, techniqueId: technique.id } })
    await db.techniqueEvaluation.create({ data: { studentTechniqueId: st.id, score: 8, evaluatedBy: instructor.id, evaluatedAt: now } })

    const after = await cycleRow(instructor.id, student.id)
    expect(after.readyForEvaluation).toBe(false)
    expect(after.cycleReps).toBe(0)
  })

  it('un kihon con 60 repeticiones queda listo', async () => {
    const { instructor, student, technique } = await setupCycle('KIHON')
    await registerPracticeLogs(student.id, [{ techniqueId: technique.id, repetitions: 60, place: PracticePlace.FUERA }])

    const row = await cycleRow(instructor.id, student.id)
    expect(row.readyForEvaluation).toBe(true)
    expect(row.cycleReps).toBe(60)
    expect(row.cycleThreshold).toBe(60)
  })
})
