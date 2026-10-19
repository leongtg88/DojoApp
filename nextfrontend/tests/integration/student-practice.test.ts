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
const { jsonRequest, readJson } = await import('./http')
const { createSchool, createBranch, createTechnique, createStudentAccount, scopeFor } = await import('./fixtures')
const { assignTechniquesToTargets } = await import('@/lib/dashboard/technique-assign')
const { consumeRateLimit } = await import('@/lib/security/rate-limit')

const practiceRoute = await import('@/app/api/dashboard/student/practice/route')
const techniquePracticeRoute = await import('@/app/api/dashboard/student/techniques/[techniqueId]/practice/route')

async function loginAsStudent(schoolId: string, branchId: string) {
  const account = await createStudentAccount({ schoolId, branchId })
  authMock.setUser(account.userId, { roles: ['STUDENT'] })
  return account
}

beforeEach(async () => {
  await resetDb()
  authMock.setUser(null)
})

// Fase 5 · F5-01 — Registrar repeticiones.
describe('F5-01 · registrar repeticiones', () => {
  it('acumula en el expediente cuando la técnica está asignada', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const { studentId } = await loginAsStudent(school.id, branch.id)
    const technique = await createTechnique('Kata Ichi', school.id)
    await assignTechniquesToTargets({
      scope: scopeFor(school.id, branch.id),
      techniqueIds: [technique.id],
      targets: [{ kind: 'STUDENT', studentIds: [studentId] }],
    })

    const res = await practiceRoute.POST(
      jsonRequest('http://t/x', 'POST', { practiceLogs: [{ techniqueId: technique.id, repetitions: 12, place: 'DOJO' }] }),
    )

    expect(res.status).toBe(201)
    const row = await db.studentTechnique.findFirstOrThrow({ where: { studentId, techniqueId: technique.id } })
    expect(row.practiceRepetitions).toBe(12)
  })

  it('guarda práctica libre y avisa cuando la técnica no es del catálogo', async () => {
    const school = await createSchool('A')
    const branch = await createBranch(school.id)
    const other = await createSchool('B')
    const { studentId } = await loginAsStudent(school.id, branch.id)
    const freeKata = await createTechnique('Kata libre', school.id)
    const foreign = await createTechnique('Ajena', other.id)

    const res = await practiceRoute.POST(
      jsonRequest('http://t/x', 'POST', {
        practiceLogs: [
          { techniqueId: freeKata.id, repetitions: 5, place: 'FUERA' },
          { techniqueId: foreign.id, repetitions: 5, place: 'DOJO' },
        ],
      }),
    )

    expect(res.status).toBe(201)
    const body = await readJson<{ registered: number; practiceWarning?: string }>(res)
    expect(body.registered).toBe(1)
    expect(body.practiceWarning).toBeTruthy()

    const logs = await db.techniquePracticeLog.findMany()
    expect(logs).toHaveLength(1)
    expect(logs[0].studentTechniqueId).toBeNull()
    expect(await db.studentTechnique.count({ where: { studentId } })).toBe(0)
  })

  it('rechaza más de 5000 repeticiones en una petición (429)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsStudent(school.id, branch.id)
    const technique = await createTechnique('Kata', school.id)

    const res = await practiceRoute.POST(
      jsonRequest('http://t/x', 'POST', { practiceLogs: [{ techniqueId: technique.id, repetitions: 6000 }] }),
    )
    expect(res.status).toBe(429)
  })
})

// Fase 5 · F5-02 — Corregir repeticiones recién guardadas.
describe('F5-02 · corregir repeticiones', () => {
  it('elimina un registro guardado y revierte el contador del expediente', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const { studentId } = await loginAsStudent(school.id, branch.id)
    const technique = await createTechnique('Kata', school.id)
    await assignTechniquesToTargets({
      scope: scopeFor(school.id, branch.id),
      techniqueIds: [technique.id],
      targets: [{ kind: 'STUDENT', studentIds: [studentId] }],
    })

    const created = await practiceRoute.POST(
      jsonRequest('http://t/x', 'POST', { practiceLogs: [{ techniqueId: technique.id, repetitions: 7 }] }),
    )
    const body = await readJson<{ logs: { logId: string }[] }>(created)

    const res = await techniquePracticeRoute.DELETE(new Request(`http://t/x?logId=${body.logs[0].logId}`, { method: 'DELETE' }))
    expect(res.status).toBe(200)

    const row = await db.studentTechnique.findFirstOrThrow({ where: { studentId, techniqueId: technique.id } })
    expect(row.practiceRepetitions).toBe(0)
  })

  it('responde 404 si el registro no existe', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsStudent(school.id, branch.id)

    const res = await techniquePracticeRoute.DELETE(new Request('http://t/x?logId=no-existe', { method: 'DELETE' }))
    expect(res.status).toBe(404)
  })
})

// Fase 5 · F5-07 — Rate limit del auto-registro de práctica.
describe('F5-07 · rate limit de práctica', () => {
  it('bloquea con 429 al superar el límite por alumno', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const { studentId } = await loginAsStudent(school.id, branch.id)
    const technique = await createTechnique('Kata', school.id)

    for (let index = 0; index < 10; index += 1) {
      await consumeRateLimit(`technique-practice:student:${studentId}`, { limit: 10, windowMs: 60 * 60 * 1000 })
    }

    const res = await practiceRoute.POST(
      jsonRequest('http://t/x', 'POST', { practiceLogs: [{ techniqueId: technique.id, repetitions: 1 }] }),
    )
    expect(res.status).toBe(429)
  })
})
