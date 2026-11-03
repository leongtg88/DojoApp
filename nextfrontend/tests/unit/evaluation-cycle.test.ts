import { describe, expect, it } from 'vitest'
import {
  EVALUATION_THRESHOLDS,
  MIN_DAYS_BETWEEN_EVALUATIONS,
  cycleRepetitions,
  evaluateCycleState,
  resolveCycleThreshold,
  suggestNextFocus,
} from '@/lib/dashboard/evaluation-cycle'

// Fase 1 · T1 — Ciclo de dominio técnico (katas + kihon).
const NOW = new Date('2026-11-03T12:00:00.000Z')
const dayMs = 24 * 60 * 60 * 1000
const daysAgo = (days: number): Date => new Date(NOW.getTime() - days * dayMs)

const log = (repetitions: number, place: string, date: Date) => ({ repetitions, place, date })

describe('resolveCycleThreshold', () => {
  it('usa 20 ejecuciones para kata y 60 repeticiones para kihon', () => {
    expect(resolveCycleThreshold('KATA')).toBe(20)
    expect(resolveCycleThreshold('KIHON')).toBe(60)
    expect(EVALUATION_THRESHOLDS.KATA).toBe(20)
    expect(EVALUATION_THRESHOLDS.KIHON).toBe(60)
  })
})

describe('cycleRepetitions', () => {
  const since = daysAgo(10)

  it('suma solo los logs posteriores a since', () => {
    const logs = [log(5, 'DOJO', daysAgo(5)), log(4, 'FUERA', daysAgo(1)), log(99, 'DOJO', daysAgo(12))]
    expect(cycleRepetitions(logs, since)).toBe(9)
  })

  it('ignora un log exactamente en since (límite excluyente)', () => {
    expect(cycleRepetitions([log(5, 'DOJO', since)], since)).toBe(0)
  })

  it('devuelve 0 sin logs', () => {
    expect(cycleRepetitions([], since)).toBe(0)
  })
})

describe('evaluateCycleState', () => {
  const assignedAt = daysAgo(30)

  it('lista con reps suficientes y sin evaluación previa', () => {
    const state = evaluateCycleState({
      category: 'KATA',
      approved: false,
      assignedAt,
      lastEvaluatedAt: null,
      logs: [log(20, 'FUERA', daysAgo(2))],
      now: NOW,
    })
    expect(state.ready).toBe(true)
    expect(state.cycleReps).toBe(20)
    expect(state.remainingReps).toBe(0)
    expect(state.reason).toBeNull()
    expect(state.daysRemaining).toBe(0)
  })

  it('no lista por reps insuficientes y calcula remainingReps', () => {
    const state = evaluateCycleState({
      category: 'KATA',
      approved: false,
      assignedAt,
      lastEvaluatedAt: null,
      logs: [log(19, 'DOJO', daysAgo(2))],
      now: NOW,
    })
    expect(state.ready).toBe(false)
    expect(state.reason).toBe('REPS')
    expect(state.remainingReps).toBe(1)
    expect(state.recommended).toBe(false)
  })

  it('no lista por cadencia y calcula los días restantes', () => {
    const state = evaluateCycleState({
      category: 'KATA',
      approved: false,
      assignedAt,
      lastEvaluatedAt: daysAgo(3),
      logs: [log(30, 'DOJO', daysAgo(2))],
      now: NOW,
    })
    expect(state.ready).toBe(false)
    expect(state.reason).toBe('CADENCE')
    expect(state.daysRemaining).toBe(MIN_DAYS_BETWEEN_EVALUATIONS - 3)
  })

  it('lista tras cumplir la cadencia (7 días)', () => {
    const state = evaluateCycleState({
      category: 'KATA',
      approved: false,
      assignedAt,
      lastEvaluatedAt: daysAgo(7),
      logs: [log(20, 'FUERA', daysAgo(2))],
      now: NOW,
    })
    expect(state.ready).toBe(true)
    expect(state.reason).toBeNull()
  })

  it('no lista si ya está dominada, aunque sobren reps', () => {
    const state = evaluateCycleState({
      category: 'KATA',
      approved: true,
      assignedAt,
      lastEvaluatedAt: null,
      logs: [log(100, 'DOJO', daysAgo(1))],
      now: NOW,
    })
    expect(state.ready).toBe(false)
    expect(state.reason).toBe('APPROVED')
    expect(state.remainingReps).toBe(0)
  })

  it('kihon lista con 60 repeticiones', () => {
    const state = evaluateCycleState({
      category: 'KIHON',
      approved: false,
      assignedAt,
      lastEvaluatedAt: null,
      logs: [log(60, 'DOJO', daysAgo(1))],
      now: NOW,
    })
    expect(state.ready).toBe(true)
    expect(state.threshold).toBe(60)
  })

  it('el ciclo arranca en la evaluación previa y no cuenta logs anteriores', () => {
    const state = evaluateCycleState({
      category: 'KATA',
      approved: false,
      assignedAt,
      lastEvaluatedAt: daysAgo(5),
      logs: [log(10, 'DOJO', daysAgo(6)), log(20, 'DOJO', daysAgo(2))],
      now: NOW,
    })
    // Solo cuentan las 20 reps posteriores a la evaluación (hace 5 días); las
    // 10 previas quedan fuera. Con el umbral cubierto bloquea por cadencia.
    expect(state.cycleReps).toBe(20)
    expect(state.reason).toBe('CADENCE')
  })
})

describe('evaluateCycleState · recommended', () => {
  const assignedAt = daysAgo(30)

  it('exige al menos un log en dojo dentro del ciclo', () => {
    const withDojo = evaluateCycleState({
      category: 'KATA',
      approved: false,
      assignedAt,
      lastEvaluatedAt: null,
      logs: [log(10, 'FUERA', daysAgo(2)), log(10, 'DOJO', daysAgo(1))],
      now: NOW,
    })
    expect(withDojo.ready).toBe(true)
    expect(withDojo.recommended).toBe(true)

    const onlyOutside = evaluateCycleState({
      category: 'KATA',
      approved: false,
      assignedAt,
      lastEvaluatedAt: null,
      logs: [log(20, 'FUERA', daysAgo(2))],
      now: NOW,
    })
    expect(onlyOutside.ready).toBe(true)
    expect(onlyOutside.recommended).toBe(false)
  })

  it('un log en dojo anterior al ciclo no marca recomendada', () => {
    const state = evaluateCycleState({
      category: 'KATA',
      approved: false,
      assignedAt,
      lastEvaluatedAt: daysAgo(5),
      logs: [log(20, 'FUERA', daysAgo(2)), log(1, 'DOJO', daysAgo(6))],
      now: NOW,
    })
    expect(state.ready).toBe(false)
    expect(state.reason).toBe('CADENCE')
    expect(state.recommended).toBe(false)
  })
})

describe('suggestNextFocus', () => {
  it('devuelve el criterio con menor nota de la rúbrica', () => {
    const criteria = {
      POSTURAS: 8,
      TECNICAS: 8,
      TRANSICIONES: 7,
      TIMING: 8,
      KOKYU: 8,
      KIME: 8,
      CONFORMIDAD: 8,
      FUERZA: 8,
      VELOCIDAD: 9,
      EQUILIBRIO: 6,
    }
    // El menor es EQUILIBRIO (6).
    expect(suggestNextFocus(7.6, criteria)).toBe('Equilibrio')
  })

  it('por banda baja devuelve reforzar fundamentos', () => {
    expect(suggestNextFocus(5, null)).toBe('Reforzar los fundamentos de la técnica')
    expect(suggestNextFocus(5.9, null)).toBe('Reforzar los fundamentos de la técnica')
  })

  it('por banda media devuelve pulir detalles', () => {
    expect(suggestNextFocus(6, null)).toBe('Pulir los detalles técnicos')
    expect(suggestNextFocus(7.4, null)).toBe('Pulir los detalles técnicos')
  })

  it('por nota >= 7.5 no hay foco pendiente', () => {
    expect(suggestNextFocus(7.5, null)).toBeNull()
    expect(suggestNextFocus(9, null)).toBeNull()
  })

  it('ignora criteria vacío o sin valores válidos y cae a la banda', () => {
    expect(suggestNextFocus(5, {})).toBe('Reforzar los fundamentos de la técnica')
    expect(suggestNextFocus(5, { OTRO: 3 })).toBe('Reforzar los fundamentos de la técnica')
  })
})
