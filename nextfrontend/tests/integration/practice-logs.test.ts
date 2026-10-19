import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PracticePlace } from '@/lib/generated/prisma'

// Las notificaciones son best-effort y disparan WhatsApp/email: se neutralizan.
vi.mock('@/lib/notifications/create', () => ({
  notifyAssignment: async () => {},
  notifySchoolStaff: async () => {},
  notifyReviewSubmitted: async () => {},
}))

const { db, resetDb } = await import('./db')
const { createSchool, createBranch, createStudent, createTechnique } = await import('./fixtures')
const { assignTechniquesToTargets } = await import('@/lib/dashboard/technique-assign')
const { registerPracticeLogs, removePracticeLog } = await import('@/lib/dashboard/technique-reps')

beforeEach(resetDb)

const scopeFor = (schoolId: string, branchId: string | null = null) => ({ isSuperAdmin: false, schoolId, branchId })

// Fase 1 · F1-05 — Registro de repeticiones: acumula en el expediente (si está
// asignada) o guarda un registro libre (si solo es del catálogo de la escuela).
describe('registerPracticeLogs', () => {
  it('acumula en el expediente las asignadas y guarda libres las demás', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const assigned = await createTechnique('Kata asignada', school.id)
    const freeKata = await createTechnique('Kata libre', school.id)

    await assignTechniquesToTargets({
      scope: scopeFor(school.id, branch.id),
      techniqueIds: [assigned.id],
      targets: [{ kind: 'STUDENT', studentIds: [student.id] }],
    })

    const result = await registerPracticeLogs(student.id, [
      { techniqueId: assigned.id, repetitions: 5, place: PracticePlace.DOJO },
      { techniqueId: freeKata.id, repetitions: 3, place: PracticePlace.FUERA },
    ])

    expect(result.created).toBe(2)
    expect(result.free).toBe(1)
    expect(result.invalid).toBe(0)
    expect(result.logs).toHaveLength(2)

    const row = await db.studentTechnique.findFirstOrThrow({ where: { studentId: student.id, techniqueId: assigned.id } })
    expect(row.practiceRepetitions).toBe(5)

    const freeLog = await db.techniquePracticeLog.findFirstOrThrow({
      where: { studentId: student.id, techniqueId: freeKata.id },
    })
    expect(freeLog.studentTechniqueId).toBeNull()
    expect(freeLog.place).toBe('FUERA')
  })

  it('ignora técnicas que no pertenecen al catálogo de la escuela del alumno', async () => {
    const schoolA = await createSchool('A')
    const branchA = await createBranch(schoolA.id)
    const schoolB = await createSchool('B')
    const student = await createStudent({ schoolId: schoolA.id, branchId: branchA.id, firstName: 'Ana', lastName: 'Uno' })
    const ajeno = await createTechnique('Kata ajena', schoolB.id)

    const result = await registerPracticeLogs(student.id, [
      { techniqueId: ajeno.id, repetitions: 4, place: PracticePlace.DOJO },
    ])

    expect(result.invalid).toBe(1)
    expect(result.created).toBe(0)
    expect(await db.techniquePracticeLog.count()).toBe(0)
  })

  it('ignora líneas con repeticiones <= 0', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const kata = await createTechnique('Kata', school.id)

    const result = await registerPracticeLogs(student.id, [
      { techniqueId: kata.id, repetitions: 0, place: PracticePlace.DOJO },
    ])

    expect(result.created).toBe(0)
    expect(await db.techniquePracticeLog.count()).toBe(0)
  })
})

describe('removePracticeLog', () => {
  it('revierte el contador del expediente al borrar una repetición asignada', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const kata = await createTechnique('Kata', school.id)

    await assignTechniquesToTargets({
      scope: scopeFor(school.id, branch.id),
      techniqueIds: [kata.id],
      targets: [{ kind: 'STUDENT', studentIds: [student.id] }],
    })

    const { logs } = await registerPracticeLogs(student.id, [
      { techniqueId: kata.id, repetitions: 5, place: PracticePlace.DOJO },
    ])

    await expect(removePracticeLog(student.id, logs[0].logId)).resolves.toBe(true)

    const row = await db.studentTechnique.findFirstOrThrow({ where: { studentId: student.id, techniqueId: kata.id } })
    expect(row.practiceRepetitions).toBe(0)
    expect(await db.techniquePracticeLog.count()).toBe(0)
  })

  it('no borra un registro de otro alumno ni uno inexistente', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const owner = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const other = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Beto', lastName: 'Dos' })
    const kata = await createTechnique('Kata', school.id)

    const { logs } = await registerPracticeLogs(owner.id, [
      { techniqueId: kata.id, repetitions: 3, place: PracticePlace.DOJO },
    ])

    await expect(removePracticeLog(other.id, logs[0].logId)).resolves.toBe(false)
    await expect(removePracticeLog(owner.id, 'log-inexistente')).resolves.toBe(false)
    expect(await db.techniquePracticeLog.count()).toBe(1)
  })
})
