import { beforeEach, describe, expect, it, vi } from 'vitest'

// Las notificaciones son best-effort y disparan WhatsApp/email: en integración no
// nos interesan (outsourcing), así que las neutralizamos.
vi.mock('@/lib/notifications/create', () => ({
  notifyAssignment: async () => {},
  notifySchoolStaff: async () => {},
  notifyReviewSubmitted: async () => {},
}))

const { db, resetDb } = await import('./db')
const { scopeFor, createSchool, createBranch, createStudent, createTechnique } = await import('./fixtures')
const { assignTechniquesToTargets } = await import('@/lib/dashboard/technique-assign')

beforeEach(resetDb)

// INV-03 · Las katas del expediente (StudentTechnique) tienen una sola puerta.
describe('INV-03 · asignación de katas del expediente', () => {
  it('asigna a alumnos concretos, persiste y es idempotente', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const a = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const b = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Beto', lastName: 'Dos' })
    const t1 = await createTechnique('Kata 1', school.id)
    const t2 = await createTechnique('Kata 2', school.id)

    const scope = scopeFor(school.id, branch.id)
    const first = await assignTechniquesToTargets({
      scope,
      techniqueIds: [t1.id, t2.id],
      targets: [{ kind: 'STUDENT', studentIds: [a.id, b.id] }],
    })

    expect(first.studentsAssigned).toBe(2)
    expect(first.linksAdded).toBe(4)
    expect(await db.studentTechnique.count()).toBe(4)

    const second = await assignTechniquesToTargets({
      scope,
      techniqueIds: [t1.id, t2.id],
      targets: [{ kind: 'STUDENT', studentIds: [a.id, b.id] }],
    })

    expect(second.studentsAssigned).toBe(0)
    expect(second.linksAdded).toBe(0)
    expect(await db.studentTechnique.count()).toBe(4)
  })

  it('no toca alumnos de otra escuela (scope)', async () => {
    const schoolA = await createSchool('A')
    const branchA = await createBranch(schoolA.id)
    const schoolB = await createSchool('B')
    const branchB = await createBranch(schoolB.id)
    const ajena = await createStudent({ schoolId: schoolB.id, branchId: branchB.id, firstName: 'Beto', lastName: 'Ajeno' })
    const technique = await createTechnique('Kata', schoolA.id)

    const result = await assignTechniquesToTargets({
      scope: scopeFor(schoolA.id, branchA.id),
      techniqueIds: [technique.id],
      targets: [{ kind: 'STUDENT', studentIds: [ajena.id] }],
    })

    expect(result.studentsAssigned).toBe(0)
    expect(await db.studentTechnique.count()).toBe(0)
  })

  it('asigna por grupo (grado)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const amarillo = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'A', lastName: 'A', currentRank: 'Amarillo' })
    await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'B', lastName: 'B', currentRank: 'Blanco' })
    const technique = await createTechnique('Kata', school.id)

    const result = await assignTechniquesToTargets({
      scope: scopeFor(school.id, branch.id),
      techniqueIds: [technique.id],
      targets: [{ kind: 'GROUP', group: { type: 'GRADE', value: 'Amarillo' } }],
    })

    expect(result.studentsAssigned).toBe(1)
    const rows = await db.studentTechnique.findMany()
    expect(rows).toHaveLength(1)
    expect(rows[0]?.studentId).toBe(amarillo.id)
  })
})
