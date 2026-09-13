import { db } from '@/lib/db'
import { StudentStatus } from '@/lib/generated/prisma'
import { KATAS, RANKS_BY_PROGRAM, type Program } from '@/lib/curriculum/programs'
import { ageFromDob, programForAge } from '@/lib/dashboard/program'
import { scopeSchoolFilter, type AdminScope } from '@/lib/dashboard/scope'

interface TechniqueLookup {
  byId: Map<string, string>
  byName: Map<string, string>
}

interface CurriculumApplicationSummary {
  ranksUpdated: number
  linksCreated: number
  missingKatas: string[]
}

interface StudentKataSummary {
  studentsProcessed: number
  linksAdded: number
}

async function loadTechniqueLookup(scope: AdminScope): Promise<TechniqueLookup> {
  const techniques = await db.technique.findMany({
    where: scope.isSuperAdmin
      ? { category: 'KATA' }
      : { category: 'KATA', OR: [{ schoolId: scope.schoolId! }, { schoolId: null }] },
    select: { id: true, name: true, schoolId: true },
  })

  const byId = new Map<string, string>()
  const byName = new Map<string, string>()

  // Las técnicas de escuela deben imponerse sobre las globales con el mismo nombre.
  for (const technique of techniques.filter(({ schoolId }) => schoolId === null)) {
    byId.set(technique.id, technique.id)
    byName.set(technique.name.trim().toLowerCase(), technique.id)
  }
  for (const technique of techniques.filter(({ schoolId }) => schoolId !== null)) {
    byId.set(technique.id, technique.id)
    byName.set(technique.name.trim().toLowerCase(), technique.id)
  }

  return { byId, byName }
}

function resolveCanonicalKataIds(program: Program, order: number, lookup: TechniqueLookup) {
  const canonical = RANKS_BY_PROGRAM[program].find((rank) => rank.order === order)

  if (!canonical) {
    return { ids: [] as string[], missing: [] as string[] }
  }

  const ids: string[] = []
  const missing: string[] = []

  for (const kataName of canonical.katas) {
    const entry = KATAS.find((kata) => kata.name === kataName)
    const techniqueId = (entry ? lookup.byId.get(entry.id) : undefined) ?? lookup.byName.get(kataName.trim().toLowerCase())

    if (techniqueId) {
      ids.push(techniqueId)
    } else {
      missing.push(kataName)
    }
  }

  return { ids, missing }
}

async function linkRankKatas(rankId: string, kataIds: string[]): Promise<number> {
  if (kataIds.length === 0) {
    return 0
  }

  const result = await db.beltRankKata.createMany({
    data: kataIds.map((kataId, position) => ({ beltRankId: rankId, kataId, order: position + 1 })),
    skipDuplicates: true,
  })

  return result.count
}

/** Completa con las katas oficiales un grado concreto (solo si está vacío). */
export async function fillRankKatasFromCurriculum(
  scope: AdminScope,
  rank: { id: string; program: Program; order: number },
): Promise<{ linksCreated: number; missingKatas: string[] }> {
  const lookup = await loadTechniqueLookup(scope)
  const { ids, missing } = resolveCanonicalKataIds(rank.program, rank.order, lookup)
  const linksCreated = await linkRankKatas(rank.id, ids)
  return { linksCreated, missingKatas: missing }
}

/**
 * Aplica el currículo oficial a los grados del alcance que no tengan katas.
 * No modifica grados ya configurados ni crea técnicas nuevas.
 */
export async function applyOfficialCurriculum(scope: AdminScope): Promise<CurriculumApplicationSummary> {
  const ranks = await db.beltRank.findMany({
    where: { ...scopeSchoolFilter(scope), katas: { none: {} } },
    select: { id: true, program: true, order: true },
  })

  if (ranks.length === 0) {
    return { ranksUpdated: 0, linksCreated: 0, missingKatas: [] }
  }

  const lookup = await loadTechniqueLookup(scope)
  const missing = new Set<string>()
  let ranksUpdated = 0
  let linksCreated = 0

  for (const rank of ranks) {
    const resolved = resolveCanonicalKataIds(rank.program as Program, rank.order, lookup)
    resolved.missing.forEach((name) => missing.add(name))

    if (resolved.ids.length === 0) {
      continue
    }

    const created = await linkRankKatas(rank.id, resolved.ids)
    if (created > 0) {
      ranksUpdated += 1
      linksCreated += created
    }
  }

  return { ranksUpdated, linksCreated, missingKatas: [...missing] }
}

async function findRankKatas(schoolId: string, program: Program, order: number) {
  const scoped = await db.beltRank.findFirst({
    where: { program, order, schoolId },
    select: { katas: { select: { kataId: true } } },
  })

  if (scoped) {
    return scoped.katas
  }

  const global = await db.beltRank.findFirst({
    where: { program, order, schoolId: null },
    select: { katas: { select: { kataId: true } } },
  })

  return global?.katas ?? []
}

/** Katas del grado indicado y del siguiente dentro del mismo programa. */
export async function resolveProgressionKataIds({
  schoolId,
  program,
  order,
}: {
  schoolId: string
  program: Program
  order: number
}): Promise<string[]> {
  const ids = new Set<string>()

  for (const targetOrder of [order, order + 1]) {
    const katas = await findRankKatas(schoolId, program, targetOrder)
    for (const { kataId } of katas) {
      ids.add(kataId)
    }
  }

  return [...ids]
}

/**
 * Asigna las katas del grado actual y siguiente a los alumnos activos que no
 * tengan ninguna kata registrada. No elimina asignaciones existentes.
 */
export async function assignCurriculumKatasToStudents(scope: AdminScope): Promise<StudentKataSummary> {
  const students = await db.student.findMany({
    where: {
      ...scopeSchoolFilter(scope),
      status: StudentStatus.ACTIVE,
      techniques: { none: {} },
    },
    select: { id: true, schoolId: true, currentRankId: true, currentRank: true, dateOfBirth: true },
  })

  let studentsProcessed = 0
  let linksAdded = 0

  for (const student of students) {
    let program: Program
    let order: number

    if (student.currentRankId) {
      const rank = await db.beltRank.findFirst({
        where: { id: student.currentRankId },
        select: { program: true, order: true },
      })

      if (!rank) {
        continue
      }

      program = rank.program as Program
      order = rank.order
    } else if (student.currentRank) {
      program = programForAge(ageFromDob(student.dateOfBirth))
      const scoped = await db.beltRank.findFirst({
        where: { name: student.currentRank, program, schoolId: student.schoolId },
        select: { order: true },
      })
      const rank = scoped ?? (await db.beltRank.findFirst({
        where: { name: student.currentRank, program, schoolId: null },
        select: { order: true },
      }))

      if (!rank) {
        continue
      }

      order = rank.order
    } else {
      continue
    }

    const techniqueIds = await resolveProgressionKataIds({ schoolId: student.schoolId, program, order })

    if (techniqueIds.length === 0) {
      continue
    }

    const result = await db.studentTechnique.createMany({
      data: techniqueIds.map((techniqueId) => ({ studentId: student.id, techniqueId })),
      skipDuplicates: true,
    })

    studentsProcessed += 1
    linksAdded += result.count
  }

  return { studentsProcessed, linksAdded }
}
