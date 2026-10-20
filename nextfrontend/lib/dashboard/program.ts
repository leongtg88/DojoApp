import { db } from '@/lib/db'
import type { Program } from '@/lib/curriculum/programs'
import { kyuDanBase, kyuMatches, normalizeKyuDanStrict } from '@/lib/curriculum/kyu-options'
import { ageFromCalendarDate } from '@/lib/format/datetime'

export function ageFromDob(dob: Date): number {
  // La fecha de nacimiento se guarda a medianoche UTC y "hoy" se evalúa en RD,
  // así que no se resta un día al comparar.
  return ageFromCalendarDate(dob) ?? 0
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
    // Los Dan guardan su nombre base con anotación ("SHODAN (1ST DAN)"), así que
    // un declarado "SHODAN" debe casar aquí (y no con "SHODAN HO" en el fuzzy).
    ranks.find((rank) => rank.kyuDan && normalizeKyuDanStrict(kyu) === normalizeKyuDanStrict(kyuDanBase(rank.kyuDan))) ??
    ranks.find((rank) => rank.kyuDan && kyuMatches(kyu, rank.kyuDan))
  return match ?? null
}