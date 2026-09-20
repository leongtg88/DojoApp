export interface RankMonthInfo {
  minMonths: number | null
  kyuDan: string | null
}

/**
 * Los grados dan tienen la palabra DAN como token en `kyuDan`
 * (p. ej. "SHODAN (1ST DAN)"). Se exige límite de palabra para no confundir
 * "SHODAN HO" (grado kyu de youth) con un dan.
 */
export function isDanRank(rank: RankMonthInfo | null | undefined): boolean {
  return /\bDAN\b/i.test(rank?.kyuDan ?? '')
}

/**
 * Meses que el alumno debe cubrir en su grado actual antes del examen.
 *
 * En el currículum de kyu `minMonths` es **acumulado desde Blanco**, así que el
 * tramo del grado es la diferencia con el siguiente grado. En los dan el valor
 * guardado es la preparación desde el grado anterior, por lo que el tramo es su
 * propio `minMonths`. El cinturón máximo (sin siguiente) usa su valor directo.
 */
export function monthsForGrade(
  currentRank: RankMonthInfo | null | undefined,
  nextRank: RankMonthInfo | null | undefined,
): number {
  const current = currentRank?.minMonths ?? 0
  if (!nextRank) return current
  const next = nextRank.minMonths ?? 0
  if (isDanRank(nextRank)) return next
  return Math.max(0, next - current)
}
