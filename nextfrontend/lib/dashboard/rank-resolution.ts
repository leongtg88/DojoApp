import type { Program } from '@/lib/curriculum/programs'

export interface StudentRankLike {
  id: string
  name: string
  program: Program
  order: number
  schoolId: string | null
}

export interface StudentRankContext {
  currentRank: string | null
  currentRankId: string | null
  studentProgram: Program
  schoolId: string
}

/**
 * Resuelve el grado (BeltRank) que corresponde a un alumno.
 *
 * Prioriza el vínculo por `currentRankId`; si no, busca por nombre EXIGIENDO el
 * mismo programa del alumno (hay nombres repetidos entre programas, p. ej.
 * "Amarillo" existe en ADULT y YOUTH) y prefiriendo el grado propio de la
 * escuela sobre el global. Sin este filtro de programa, un niño podía quedar
 * apuntando al grado de adultos y ver un "siguiente cinturón" distinto al real.
 */
export function pickStudentRank<T extends StudentRankLike>(
  ranks: T[],
  { currentRank, currentRankId, studentProgram, schoolId }: StudentRankContext,
): T | null {
  if (currentRankId) {
    const byId = ranks.find((rank) => rank.id === currentRankId)
    if (byId) return byId
  }

  const candidates = ranks.filter((rank) => rank.name === currentRank)

  return (
    candidates.find((rank) => rank.program === studentProgram && rank.schoolId === schoolId) ??
    candidates.find((rank) => rank.program === studentProgram) ??
    candidates.find((rank) => rank.schoolId === schoolId) ??
    candidates[0] ??
    null
  )
}
