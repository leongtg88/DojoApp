import { db } from '@/lib/db'
import type { Program } from '@/lib/curriculum/programs'

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