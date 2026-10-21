import { formatMonthKey } from '@/lib/format/datetime'
import { santoDomingoDayKey } from '@/lib/dashboard/schedule-utils'
import type { AbsencePostClosePolicy } from '@/types/dashboard'

/**
 * Faltas incluidas por mes antes de exigir reposición. Aplica a faltas
 * justificadas y no justificadas: desde la tercera falta del mes el alumno debe
 * reponerla en otro horario (o en una clase online de 35 min acordada).
 */
export const FREE_ABSENCES_PER_MONTH = 2

/** Falta que participa del control mensual. */
export interface AbsenceLike {
  date: Date
  status: string
  recoveredById: string | null
  /** Fecha de la asistencia de reposición (`recoveredBy.date`). */
  recoveredAt: Date | null
}

export interface AbsenceSummaryOptions {
  /** Fin exclusivo del cuatrimestre si ya cerró; `null` si sigue abierto. */
  closedAt?: Date | null
  /** Política vigente al cierre. Solo se usa cuando `closedAt` no es `null`. */
  policy?: AbsencePostClosePolicy
}

export interface MonthlyAbsenceSummary {
  /** Clave del mes en zona RD: "YYYY-MM". */
  key: string
  label: string
  /** Total de faltas del mes, incluidas las repuestas. */
  count: number
  /** Faltas del mes marcadas como repuestas, incluidas las fuera de plazo. */
  recovered: number
  /** Repuestas que también eran justificadas (no consumen las 2 eximidas). */
  recoveredJustified: number
  /** Faltas justificadas del mes. */
  justified: number
  /** Hasta 2 justificadas no repuestas que no descuentan del % mínimo. */
  forgivenSessions: number
  /** Repuestas + justificadas eximidas que se acreditan en el % del mes. */
  creditedSessions: number
  /** Reposiciones hechas después del cierre (no restauran bajo LOCK). */
  lateRecovery: number
  /** Faltas por encima del cupo mensual (informativo). */
  excess: number
  /** Faltas 3.ª+ sin reponer: las que exigen reposición. */
  pendingRecovery: number
}

/**
 * Agrupa las faltas por mes calendario de Santo Domingo. Una falta repuesta
 * sigue contando en el total del mes. Bajo `LOCK_AT_CLOSE`, una reposición
 * posterior al cierre no reduce las pendientes de ese cuatrimestre.
 */
export function summarizeMonthlyAbsences(
  absences: AbsenceLike[],
  options: AbsenceSummaryOptions = {},
): MonthlyAbsenceSummary[] {
  const closedAt = options.closedAt ?? null
  const policy = options.policy ?? 'LOCK_AT_CLOSE'

  const byMonth = new Map<string, {
    count: number
    recovered: number
    recoveredJustified: number
    justified: number
    effectiveRecovered: number
    lateRecovery: number
  }>()

  const countsAsRecovered = (absence: AbsenceLike): boolean => {
    if (!absence.recoveredById) return false
    if (!closedAt || policy === 'RESTORE_ON_RECOVERY') return true
    return absence.recoveredAt != null && absence.recoveredAt.getTime() <= closedAt.getTime()
  }

  for (const absence of absences) {
    const key = santoDomingoDayKey(absence.date).slice(0, 7)
    const current = byMonth.get(key) ?? {
      count: 0,
      recovered: 0,
      recoveredJustified: 0,
      justified: 0,
      effectiveRecovered: 0,
      lateRecovery: 0,
    }

    current.count += 1
    if (absence.status === 'JUSTIFIED') current.justified += 1

    if (absence.recoveredById) {
      current.recovered += 1
      if (absence.status === 'JUSTIFIED') current.recoveredJustified += 1
      if (countsAsRecovered(absence)) current.effectiveRecovered += 1
      else current.lateRecovery += 1
    }

    byMonth.set(key, current)
  }

  return [...byMonth.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, month]) => {
      const justifiedNotRecovered = Math.max(0, month.justified - month.recoveredJustified)
      const forgivenSessions = forgivenAttendance(justifiedNotRecovered)
      return {
        key,
        label: formatMonthKey(key),
        count: month.count,
        recovered: month.recovered,
        recoveredJustified: month.recoveredJustified,
        justified: month.justified,
        forgivenSessions,
        creditedSessions: month.recovered + forgivenSessions,
        lateRecovery: month.lateRecovery,
        excess: Math.max(0, month.count - FREE_ABSENCES_PER_MONTH),
        pendingRecovery: Math.max(0, month.count - month.effectiveRecovered - FREE_ABSENCES_PER_MONTH),
      }
    })
}

export interface ExamRightBlock {
  /** Fin exclusivo del cuatrimestre. */
  end: Date
  /** Faltas 3.ª+ del cuatrimestre que siguen sin reponerse. */
  pendingRecovery: number
}

/**
 * El derecho no se pierde al momento de la 3.ª falta: durante el cuatrimestre
 * queda en riesgo y solo se pierde cuando el cuatrimestre cierra con faltas
 * pendientes de reponer.
 */
export function evaluateExamRight(
  blocks: ExamRightBlock[],
  today: Date,
): { lost: boolean; atRisk: boolean } {
  const lost = blocks.some((block) => block.end.getTime() <= today.getTime() && block.pendingRecovery > 0)
  const atRisk = !lost && blocks.some((block) => block.pendingRecovery > 0)
  return { lost, atRisk }
}

/** Hasta 2 faltas justificadas del mes no descuentan del porcentaje mínimo. */
export function forgivenAttendance(justifiedAbsences: number): number {
  return Math.min(FREE_ABSENCES_PER_MONTH, Math.max(0, justifiedAbsences))
}

export interface AbsencePolicyPoint {
  policy: AbsencePostClosePolicy
  effectiveFrom: Date
}

/**
 * Política vigente en una fecha. El historial se ordena por `effectiveFrom`;
 * si no hay fila anterior, el valor por defecto es LOCK_AT_CLOSE.
 */
export function resolveAbsencePolicyAt(
  points: AbsencePolicyPoint[],
  at: Date,
): AbsencePostClosePolicy {
  let current: AbsencePostClosePolicy = 'LOCK_AT_CLOSE'
  const sorted = [...points].sort((left, right) => left.effectiveFrom.getTime() - right.effectiveFrom.getTime())

  for (const point of sorted) {
    if (point.effectiveFrom.getTime() <= at.getTime()) current = point.policy
    else break
  }

  return current
}
