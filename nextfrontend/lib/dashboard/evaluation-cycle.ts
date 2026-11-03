/**
 * Ciclo de Dominio Técnico · Fase 1 (katas + kihon).
 *
 * Cierra el bucle "practicar → estar listo → evaluar → feedback → nueva meta"
 * con datos que ya existen en el expediente, sin migración de BD. El estado
 * derivado ("Lista para evaluar", "Recomendada") se calcula aquí y no se
 * almacena; las queries del sensei y del alumno lo consumen como fuente única.
 *
 * Módulo **puro**: no importa Prisma ni `@/lib/db`; recibe los logs ya resueltos.
 */

import { KATA_CRITERION_KEYS, KATA_RUBRIC } from '@/lib/dashboard/kata-rubric'

/** Categorías que participan del ciclo de dominio en Fase 1. */
export type EvaluationCategory = 'KATA' | 'KIHON'

/** Motivo por el que una técnica aún no está lista para evaluar. */
export type CycleBlockReason = 'REPS' | 'CADENCE' | 'APPROVED'

/**
 * Umbral de repeticiones por categoría. Para kata, una repetición equivale a
 * una ejecución completa del kata (no a un movimiento). Para kihon, una
 * ejecución del fundamento.
 */
export const EVALUATION_THRESHOLDS: Readonly<Record<EvaluationCategory, number>> = {
  KATA: 20,
  KIHON: 60,
}

/** Días mínimos que deben pasar entre dos evaluaciones de la misma técnica. */
export const MIN_DAYS_BETWEEN_EVALUATIONS = 7

const DAY_MS = 24 * 60 * 60 * 1000

export interface PracticeLogLike {
  repetitions: number
  place: string
  date: Date
}

/**
 * Estado derivado del ciclo de una técnica. "Lista" (`ready`) y "Recomendada"
 * (`recommended`) nunca se guardan; se recalculan con cada consulta.
 */
export interface EvaluationCycleState {
  ready: boolean
  /** Lista y con al menos un log en dojo dentro del ciclo. */
  recommended: boolean
  /** Repeticiones acumuladas en el ciclo (logs con `date > inicioCiclo`). */
  cycleReps: number
  /** Umbral de la categoría. */
  threshold: number
  /** Repeticiones que faltan para llegar al umbral (0 cuando no bloquea por reps). */
  remainingReps: number
  reason: CycleBlockReason | null
  /** Días restantes para cumplir la cadencia; mayor que 0 solo con `reason === 'CADENCE'`. */
  daysRemaining: number
}

/** Umbral de repeticiones para una categoría del ciclo. */
export function resolveCycleThreshold(category: EvaluationCategory): number {
  return EVALUATION_THRESHOLDS[category]
}

/**
 * Suma las repeticiones de los logs posteriores a `since` (inicio del ciclo).
 * Los logs con fecha igual o anterior a `since` quedan fuera: un log registrado
 * en el mismo instante de la evaluación no abre un ciclo nuevo.
 */
export function cycleRepetitions(logs: ReadonlyArray<PracticeLogLike>, since: Date): number {
  const sinceMs = since.getTime()
  let total = 0
  for (const log of logs) {
    if (log.date.getTime() > sinceMs) total += log.repetitions
  }
  return total
}

export interface EvaluateCycleStateInput {
  category: EvaluationCategory
  approved: boolean
  assignedAt: Date
  lastEvaluatedAt: Date | null
  logs: ReadonlyArray<PracticeLogLike>
  now?: Date
}

/**
 * Resuelve el estado del ciclo para una técnica KATA o KIHON.
 *
 * Prioridad de bloqueo: `APPROVED` (ya dominada) → `REPS` (falta volumen) →
 * `CADENCE` (no pasó una semana desde la última evaluación).
 */
export function evaluateCycleState(input: EvaluateCycleStateInput): EvaluationCycleState {
  const threshold = resolveCycleThreshold(input.category)
  const since = input.lastEvaluatedAt ?? input.assignedAt
  const cycleReps = cycleRepetitions(input.logs, since)

  if (input.approved) {
    return { ready: false, recommended: false, cycleReps, threshold, remainingReps: 0, reason: 'APPROVED', daysRemaining: 0 }
  }

  const remainingReps = Math.max(0, threshold - cycleReps)
  if (remainingReps > 0) {
    return { ready: false, recommended: false, cycleReps, threshold, remainingReps, reason: 'REPS', daysRemaining: 0 }
  }

  if (input.lastEvaluatedAt) {
    const now = input.now ?? new Date()
    const daysSince = Math.floor((now.getTime() - input.lastEvaluatedAt.getTime()) / DAY_MS)
    if (daysSince < MIN_DAYS_BETWEEN_EVALUATIONS) {
      return {
        ready: false,
        recommended: false,
        cycleReps,
        threshold,
        remainingReps: 0,
        reason: 'CADENCE',
        daysRemaining: MIN_DAYS_BETWEEN_EVALUATIONS - daysSince,
      }
    }
  }

  const sinceMs = since.getTime()
  const recommended = input.logs.some((log) => log.date.getTime() > sinceMs && log.place === 'DOJO')
  return { ready: true, recommended, cycleReps, threshold, remainingReps: 0, reason: null, daysRemaining: 0 }
}

const CRITERION_LABELS = new Map<string, string>()
for (const block of KATA_RUBRIC) {
  for (const criterion of block.criteria) {
    CRITERION_LABELS.set(criterion.key, criterion.label)
  }
}

const FOCUS_LOW_SCORE = 'Reforzar los fundamentos de la técnica'
const FOCUS_MID_SCORE = 'Pulir los detalles técnicos'

/**
 * Sugiere el próximo foco de práctica tras una evaluación.
 *
 * - Kata con rúbrica: devuelve el criterio con menor nota (su etiqueta).
 * - Kata sin rúbrica o kihon: por banda de nota (`<6`, `6–7.4`, `>=7.5`).
 * - `>= 7.5` no tiene foco pendiente: devuelve `null`.
 */
export function suggestNextFocus(score: number, criteria: Record<string, number> | null): string | null {
  if (criteria && Object.keys(criteria).length > 0) {
    let lowestKey: string | null = null
    let lowest = Number.POSITIVE_INFINITY
    for (const key of KATA_CRITERION_KEYS) {
      const value = criteria[key]
      if (typeof value === 'number' && Number.isFinite(value) && value < lowest) {
        lowest = value
        lowestKey = key
      }
    }
    if (lowestKey) {
      return CRITERION_LABELS.get(lowestKey) ?? null
    }
  }

  if (score < 6) return FOCUS_LOW_SCORE
  if (score < 7.5) return FOCUS_MID_SCORE
  return null
}
