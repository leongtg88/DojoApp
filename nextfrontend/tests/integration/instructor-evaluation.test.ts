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
const { createSchool, createBranch, createStudent, createTechnique, createUser, scopeFor } = await import('./fixtures')
const { assignTechniquesToTargets } = await import('@/lib/dashboard/technique-assign')

const techniquesRoute = await import('@/app/api/dashboard/instructor/techniques/route')
const assignRoute = await import('@/app/api/dashboard/instructor/techniques/assign/route')
const assignBulkRoute = await import('@/app/api/dashboard/instructor/techniques/assign-bulk/route')
const techniqueAssignRoute = await import('@/app/api/dashboard/instructor/techniques/[techniqueId]/assign/route')

const FULL_CRITERIA = {
  POSTURAS: 8,
  TECNICAS: 8,
  TRANSICIONES: 8,
  TIMING: 8,
  KOKYU: 8,
  KIME: 8,
  CONFORMIDAD: 8,
  FUERZA: 6,
  VELOCIDAD: 6,
  EQUILIBRIO: 6,
}

async function loginAsInstructor(schoolId: string) {
  const instructor = await createUser({ email: `i-${randomUUID()}@test.dev`, roles: ['INSTRUCTOR'], schoolId })
  authMock.setUser(instructor.id, { roles: ['INSTRUCTOR'], schoolId })
  return instructor
}

async function assign(studentId: string, techniqueId: string, schoolId: string, branchId: string) {
  await assignTechniquesToTargets({
    scope: scopeFor(schoolId, branchId),
    techniqueIds: [techniqueId],
    targets: [{ kind: 'STUDENT', studentIds: [studentId] }],
  })
}

beforeEach(async () => {
  await resetDb()
  authMock.setUser(null)
})

// Fase 6 · F6-05 — Evaluar técnica (no kata): estado + nota + feedback.
describe('F6-05 · evaluar técnica', () => {
  it('marca la técnica como revisada y guarda la evaluación', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsInstructor(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const technique = await createTechnique('Age Uke', school.id, 'KIHON')
    await assign(student.id, technique.id, school.id, branch.id)

    const res = await techniquesRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', {
        studentId: student.id,
        techniqueId: technique.id,
        approved: true,
        inPractice: false,
        score: 8.5,
        feedback: 'Buena ejecución',
        notes: 'Mejorar guardia',
      }),
    )

    expect(res.status).toBe(200)
    const studentTechnique = await db.studentTechnique.findFirstOrThrow({ where: { studentId: student.id, techniqueId: technique.id } })
    expect(studentTechnique.approved).toBe(true)
    const evaluation = await db.techniqueEvaluation.findFirstOrThrow({ where: { studentTechniqueId: studentTechnique.id } })
    expect(evaluation.score).toBe(8.5)
    expect(evaluation.feedback).toBe('Buena ejecución')
  })

  it('rechaza evaluar a un alumno de otra escuela (403)', async () => {
    const school = await createSchool('A')
    const other = await createSchool('B')
    const otherBranch = await createBranch(other.id)
    await loginAsInstructor(school.id)
    const foreign = await createStudent({ schoolId: other.id, branchId: otherBranch.id, firstName: 'Ajeno', lastName: 'X' })
    const technique = await createTechnique('Kata', school.id)

    const res = await techniquesRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { studentId: foreign.id, techniqueId: technique.id, approved: true }),
    )
    expect(res.status).toBe(403)
  })

  it('responde 404 si la técnica no está asignada al alumno', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsInstructor(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const technique = await createTechnique('Kata', school.id)

    const res = await techniquesRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { studentId: student.id, techniqueId: technique.id, approved: true }),
    )
    expect(res.status).toBe(404)
  })
})

// Fase 6 · F6-06 — Evaluación de kata por rúbrica (70/30).
describe('F6-06 · evaluación de kata por criterios', () => {
  it('calcula la nota ponderada y guarda los criterios', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsInstructor(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const kata = await createTechnique('Pinan Shodan', school.id, 'KATA')
    await assign(student.id, kata.id, school.id, branch.id)

    const res = await techniquesRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { studentId: student.id, techniqueId: kata.id, criteria: FULL_CRITERIA }),
    )

    expect(res.status).toBe(200)
    const studentTechnique = await db.studentTechnique.findFirstOrThrow({ where: { studentId: student.id, techniqueId: kata.id } })
    const evaluation = await db.techniqueEvaluation.findFirstOrThrow({ where: { studentTechniqueId: studentTechnique.id } })
    expect(evaluation.score).toBe(7.4)
    expect(evaluation.criteria).toEqual(FULL_CRITERIA)
  })

  it('rechaza una rúbrica incompleta (400)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsInstructor(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const kata = await createTechnique('Pinan Shodan', school.id, 'KATA')
    await assign(student.id, kata.id, school.id, branch.id)

    const res = await techniquesRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { studentId: student.id, techniqueId: kata.id, criteria: { POSTURAS: 8 } }),
    )
    expect(res.status).toBe(400)
  })
})

// Fase 6 · F6-07 — Ajustar las katas del expediente (solo agrega; no quita revisadas).
describe('F6-07 · ajustar katas del expediente', () => {
  it('quita las no revisadas y conserva las aprobadas', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsInstructor(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const keep = await createTechnique('Kata 1', school.id)
    const approved = await createTechnique('Kata 2', school.id)
    await assignTechniquesToTargets({
      scope: scopeFor(school.id, branch.id),
      techniqueIds: [keep.id, approved.id],
      targets: [{ kind: 'STUDENT', studentIds: [student.id] }],
    })
    await db.studentTechnique.updateMany({ where: { studentId: student.id, techniqueId: approved.id }, data: { approved: true } })

    const res = await assignRoute.PUT(jsonRequest('http://t/x', 'PUT', { studentId: student.id, techniqueIds: [keep.id] }))

    expect(res.status).toBe(200)
    const body = await readJson<{ added: number; removed: number; skipped: number }>(res)
    expect(body.removed).toBe(0)
    expect(body.skipped).toBe(1)

    const rows = await db.studentTechnique.findMany({ where: { studentId: student.id } })
    expect(rows.map((row) => row.techniqueId).sort()).toEqual([keep.id, approved.id].sort())
  })
})

// Fase 6 · F6-08 — Asignar técnica a alumno/grupo.
describe('F6-08 · asignar técnica a alumno o grupo', () => {
  it('asigna a un alumno concreto', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsInstructor(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const technique = await createTechnique('Kata', school.id)

    const res = await techniqueAssignRoute.POST(
      jsonRequest('http://t/x', 'POST', { targets: [{ kind: 'STUDENT', studentIds: [student.id] }] }),
      routeParams({ techniqueId: technique.id }),
    )

    expect(res.status).toBe(200)
    expect((await readJson<{ studentsAssigned: number }>(res)).studentsAssigned).toBe(1)
    expect(await db.studentTechnique.count({ where: { studentId: student.id, techniqueId: technique.id } })).toBe(1)
  })

  it('asigna a todos los alumnos activos de la escuela (grupo ALL)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsInstructor(school.id)
    await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Beto', lastName: 'Dos' })
    const technique = await createTechnique('Kata', school.id)

    const res = await assignBulkRoute.POST(
      jsonRequest('http://t/x', 'POST', { techniqueIds: [technique.id], targets: [{ kind: 'GROUP', group: { type: 'ALL' } }] }),
    )

    expect(res.status).toBe(200)
    const body = await readJson<{ studentsAssigned: number; linksAdded: number }>(res)
    expect(body.studentsAssigned).toBe(2)
    expect(await db.studentTechnique.count()).toBe(2)
  })
})
