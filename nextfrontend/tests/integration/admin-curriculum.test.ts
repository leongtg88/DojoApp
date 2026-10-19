import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/auth', async () => {
  const mod = await import('./route-auth')
  return { auth: mod.authMock.auth }
})

// Las notificaciones son best-effort (WhatsApp/email): se neutralizan.
vi.mock('@/lib/notifications/create', () => ({
  notifyAssignment: async () => {},
  notifySchoolStaff: async () => {},
  notifyReviewSubmitted: async () => {},
}))

const { db, resetDb } = await import('./db')
const { authMock } = await import('./route-auth')
const { jsonRequest, routeParams, readJson } = await import('./http')
const { createSchool, createBranch, createStudent, createTechnique } = await import('./fixtures')

type TestRole = 'STUDENT' | 'GUARDIAN' | 'INSTRUCTOR' | 'SCHOOL_ADMIN' | 'SUPERADMIN'

const ranksRoute = await import('@/app/api/dashboard/admin/belt-ranks/route')
const rankKatasRoute = await import('@/app/api/dashboard/admin/belt-ranks/[rankId]/katas/route')
const reorderRoute = await import('@/app/api/dashboard/admin/belt-ranks/reorder/route')
const applyCurriculumRoute = await import('@/app/api/dashboard/admin/belt-ranks/apply-curriculum/route')
const techniquesRoute = await import('@/app/api/dashboard/admin/techniques/route')

async function loginAs(schoolId: string | null, roles: TestRole[] = ['SCHOOL_ADMIN']) {
  const user = await db.user.create({ data: { email: `u-${randomUUID()}@test.dev`, roles, schoolId } })
  authMock.setUser(user.id)
  return user
}

async function makeRank(schoolId: string | null, overrides: { name?: string; order?: number; program?: 'ADULT' | 'YOUTH' } = {}) {
  return db.beltRank.create({
    data: { program: overrides.program ?? 'ADULT', name: overrides.name ?? 'Blanco', order: overrides.order ?? 1, schoolId },
    select: { id: true },
  })
}

beforeEach(async () => {
  await resetDb()
  authMock.setUser(null)
})

// Fase 2 · F2-01 — Crear grado.
describe('F2-01 · crear grado', () => {
  it('crea el grado en la escuela del admin', async () => {
    const school = await createSchool()
    await loginAs(school.id)

    const res = await ranksRoute.POST(
      jsonRequest('http://t/api/dashboard/admin/belt-ranks', 'POST', { name: 'Blanco', program: 'ADULT', order: 1 }),
    )

    expect(res.status).toBe(201)
    const body = await readJson<{ rank: { name: string; schoolId: string | null } }>(res)
    expect(body.rank.name).toBe('Blanco')
    expect(body.rank.schoolId).toBe(school.id)
  })

  it('rechaza un nombre duplicado en el mismo programa (409)', async () => {
    const school = await createSchool()
    await loginAs(school.id)
    await ranksRoute.POST(jsonRequest('http://t/x', 'POST', { name: 'Blanco', program: 'ADULT' }))

    const dup = await ranksRoute.POST(jsonRequest('http://t/x', 'POST', { name: 'Blanco', program: 'ADULT' }))
    expect(dup.status).toBe(409)
  })

  it('sin sesión responde 403', async () => {
    const res = await ranksRoute.POST(jsonRequest('http://t/x', 'POST', { name: 'Blanco' }))
    expect(res.status).toBe(403)
  })
})

// Fase 2 · F2-02 — Asignar katas al grado (reemplaza el set y propaga a alumnos).
describe('F2-02 · asignar katas al grado', () => {
  it('reemplaza el set y propaga a los alumnos activos del grado', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAs(school.id)
    const rank = await makeRank(school.id, { name: 'Blanco' })
    const t1 = await createTechnique('Kata 1', school.id)
    const t2 = await createTechnique('Kata 2', school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno', currentRank: 'Blanco' })

    const res = await rankKatasRoute.PUT(
      jsonRequest('http://t/x', 'PUT', { techniqueIds: [t1.id, t2.id], assignToStudents: true }),
      routeParams({ rankId: rank.id }),
    )

    expect(res.status).toBe(200)
    expect((await readJson<{ studentsAssigned: number }>(res)).studentsAssigned).toBe(1)

    const links = await db.beltRankKata.findMany({ where: { beltRankId: rank.id }, orderBy: { order: 'asc' } })
    expect(links.map((link) => link.kataId)).toEqual([t1.id, t2.id])
    expect(await db.studentTechnique.count({ where: { studentId: student.id } })).toBe(2)
  })

  it('reemplaza el set (no acumula) en una segunda asignación', async () => {
    const school = await createSchool()
    await loginAs(school.id)
    const rank = await makeRank(school.id)
    const t1 = await createTechnique('Kata 1', school.id)
    const t2 = await createTechnique('Kata 2', school.id)

    await rankKatasRoute.PUT(jsonRequest('http://t/x', 'PUT', { techniqueIds: [t1.id] }), routeParams({ rankId: rank.id }))
    await rankKatasRoute.PUT(jsonRequest('http://t/x', 'PUT', { techniqueIds: [t2.id] }), routeParams({ rankId: rank.id }))

    const links = await db.beltRankKata.findMany({ where: { beltRankId: rank.id } })
    expect(links.map((link) => link.kataId)).toEqual([t2.id])
  })

  it('rechaza técnicas de otra escuela (400) y grados ajenos (404)', async () => {
    const school = await createSchool('A')
    const other = await createSchool('B')
    await loginAs(school.id)
    const rank = await makeRank(school.id)
    const ajeno = await createTechnique('Kata ajena', other.id)

    const badTechnique = await rankKatasRoute.PUT(
      jsonRequest('http://t/x', 'PUT', { techniqueIds: [ajeno.id] }),
      routeParams({ rankId: rank.id }),
    )
    expect(badTechnique.status).toBe(400)

    const otherRank = await makeRank(other.id)
    const notFound = await rankKatasRoute.PUT(
      jsonRequest('http://t/x', 'PUT', { techniqueIds: [] }),
      routeParams({ rankId: otherRank.id }),
    )
    expect(notFound.status).toBe(404)
  })
})

// Fase 2 · F2-03 — Reordenar grados (y su límite de alcance).
describe('F2-03 · reordenar grados', () => {
  it('el admin de escuela reordena sus propios grados', async () => {
    const school = await createSchool()
    await loginAs(school.id)
    const r1 = await makeRank(school.id, { name: 'Blanco', order: 1 })
    const r2 = await makeRank(school.id, { name: 'Amarillo', order: 2 })

    const res = await reorderRoute.PUT(jsonRequest('http://t/x', 'PUT', { program: 'ADULT', rankIds: [r2.id, r1.id] }))
    expect(res.status).toBe(200)

    const after = await db.beltRank.findMany({ where: { schoolId: school.id }, orderBy: { order: 'asc' } })
    expect(after.map((rank) => rank.id)).toEqual([r2.id, r1.id])
  })

  it('rechaza duplicados (400) y grados de otra escuela (403)', async () => {
    const school = await createSchool('A')
    const other = await createSchool('B')
    await loginAs(school.id)
    const own = await makeRank(school.id)
    const foreign = await makeRank(other.id, { name: 'Ajeno' })

    const dup = await reorderRoute.PUT(jsonRequest('http://t/x', 'PUT', { program: 'ADULT', rankIds: [own.id, own.id] }))
    expect(dup.status).toBe(400)

    const cross = await reorderRoute.PUT(jsonRequest('http://t/x', 'PUT', { program: 'ADULT', rankIds: [own.id, foreign.id] }))
    expect(cross.status).toBe(403)
  })
})

// Fase 2 · F2-04 — Aplicar currículo oficial sin pisar grados configurados.
describe('F2-04 · aplicar currículo oficial', () => {
  it('no modifica un grado que ya tiene katas', async () => {
    const school = await createSchool()
    await loginAs(school.id)
    const rank = await makeRank(school.id, { order: 1 })
    const propia = await createTechnique('Kata propia', school.id)
    await db.beltRankKata.create({ data: { beltRankId: rank.id, kataId: propia.id, order: 1 } })

    const res = await applyCurriculumRoute.POST()
    expect(res.status).toBe(200)

    const links = await db.beltRankKata.findMany({ where: { beltRankId: rank.id } })
    expect(links.map((link) => link.kataId)).toEqual([propia.id])
  })

  it('rellena un grado vacío con las katas oficiales presentes en el catálogo', async () => {
    const school = await createSchool()
    await loginAs(school.id)
    const { RANKS_BY_PROGRAM } = await import('@/lib/curriculum/programs')
    const canonical = RANKS_BY_PROGRAM.ADULT.find((entry) => entry.order === 1)
    expect(canonical).toBeDefined()
    const kata = await createTechnique(canonical!.katas[0], school.id)
    const rank = await makeRank(school.id, { order: 1 })

    const res = await applyCurriculumRoute.POST()
    const body = await readJson<{ ranksUpdated: number; linksCreated: number }>(res)
    expect(body.ranksUpdated).toBe(1)
    expect(body.linksCreated).toBe(1)

    const links = await db.beltRankKata.findMany({ where: { beltRankId: rank.id } })
    expect(links.map((link) => link.kataId)).toEqual([kata.id])
  })
})

// Fase 2 · F2-05 — CRUD de técnica (crear + enlace a grado).
describe('F2-05 · crear técnica', () => {
  it('crea la técnica y la enlaza al grado indicado', async () => {
    const school = await createSchool()
    await loginAs(school.id)
    const rank = await makeRank(school.id)

    const res = await techniquesRoute.POST(
      jsonRequest('http://t/x', 'POST', { name: 'Kata Nueva', category: 'KATA', rankId: rank.id }),
    )

    expect(res.status).toBe(201)
    const body = await readJson<{ technique: { id: string }; linksCreated: number }>(res)
    expect(body.linksCreated).toBe(1)
    expect(await db.beltRankKata.count({ where: { beltRankId: rank.id, kataId: body.technique.id } })).toBe(1)
  })

  it('rechaza una categoría inválida (400)', async () => {
    const school = await createSchool()
    await loginAs(school.id)
    const res = await techniquesRoute.POST(jsonRequest('http://t/x', 'POST', { name: 'X', category: 'NOPE' }))
    expect(res.status).toBe(400)
  })

  it('rechaza un grado que no está disponible para la escuela (400)', async () => {
    const school = await createSchool('A')
    const other = await createSchool('B')
    await loginAs(school.id)
    const foreign = await makeRank(other.id)

    const res = await techniquesRoute.POST(
      jsonRequest('http://t/x', 'POST', { name: 'Kata', category: 'KATA', rankId: foreign.id }),
    )
    expect(res.status).toBe(400)
  })
})
