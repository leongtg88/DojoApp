import { db } from '@/lib/db'
import type { Program } from '@/lib/curriculum/programs'
import { kyuMatches, normalizeKyuDanStrict } from '@/lib/curriculum/kyu-options'

export function ageFromDob(dob: Date): number {
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1
  }
  return age
}

export function programForAge(age: number): Program {
  return age >= 18 ? 'ADULT' : 'YOUTH'
}

export type ClassAudience = 'ADULTS' | 'CHILDREN' | 'MIXED'

export function audienceForAge(age: number): ClassAudience {
  return age >= 18 ? 'ADULTS' : 'CHILDREN'
}

export async function resolveDefaultRank(schoolId: string, dateOfBirth: Date) {
  const program = programForAge(ageFromDob(dateOfBirth))
  return db.beltRank.findFirst({
    where: {
      program,
      order: 1,
      OR: [{ schoolId }, { schoolId: null }],
    },
    select: {
      id: true,
      name: true,
      program: true,
      order: true,
      katas: { select: { kataId: true }, orderBy: { order: 'asc' } },
    },
  })
}

// Resuelve el BeltRank del programa del aspirante que coincide con el grado de
// karate previo declarado (Kyu/Dan) en el formulario de inscripción. Devuelve
// null si no hay coincidencia (el expediente queda como cinturón blanco).
export async function resolveRankForKyu(schoolId: string, dateOfBirth: Date, kyu: string) {
  const program = programForAge(ageFromDob(dateOfBirth))
  const ranks = await db.beltRank.findMany({
    where: {
      program,
      OR: [{ schoolId }, { schoolId: null }],
    },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      name: true,
      kyuDan: true,
      program: true,
      order: true,
    },
  })

  const match =
    ranks.find((rank) => rank.kyuDan && normalizeKyuDanStrict(kyu) === normalizeKyuDanStrict(rank.kyuDan)) ??
    ranks.find((rank) => rank.kyuDan && kyuMatches(kyu, rank.kyuDan))
  return match ?? null
}