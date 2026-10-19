import { describe, expect, it } from 'vitest'
import {
  KATA_CRITERION_KEYS,
  KATA_RUBRIC,
  averageKataCriteria,
  blockAverage,
  isCompleteKataCriteria,
  parseKataCriteria,
} from '@/lib/dashboard/kata-rubric'

// Fase 6 · F6-06 — Rúbrica de kata: 70% técnico + 30% atlético.
const complete = Object.fromEntries(KATA_CRITERION_KEYS.map((key) => [key, 8])) as Record<string, number>

describe('isCompleteKataCriteria', () => {
  it('acepta los 10 criterios dentro de rango', () => {
    expect(isCompleteKataCriteria(complete)).toBe(true)
  })

  it('rechaza si falta un criterio', () => {
    const partial = { ...complete }
    delete partial.EQUILIBRIO
    expect(isCompleteKataCriteria(partial)).toBe(false)
  })

  it('rechaza valores fuera de rango', () => {
    expect(isCompleteKataCriteria({ ...complete, KIME: 11 })).toBe(false)
    expect(isCompleteKataCriteria(null)).toBe(false)
  })
})

describe('blockAverage', () => {
  it('promedia sin ponderar los criterios del bloque', () => {
    const tecnico = KATA_RUBRIC.find((block) => block.key === 'TECNICO')!
    expect(blockAverage(tecnico, complete)).toBe(8)
  })

  it('devuelve null si falta algún criterio del bloque', () => {
    const tecnico = KATA_RUBRIC.find((block) => block.key === 'TECNICO')!
    const partial = { ...complete }
    delete partial.TIMING
    expect(blockAverage(tecnico, partial)).toBeNull()
  })
})

describe('averageKataCriteria', () => {
  it('aplica los pesos 70/30', () => {
    // Técnico 8, Atlético 6 → 8*0.7 + 6*0.3 = 7.4
    const scores = {
      ...complete,
      FUERZA: 6,
      VELOCIDAD: 6,
      EQUILIBRIO: 6,
    }
    expect(averageKataCriteria(scores)).toBe(7.4)
  })

  it('un puntaje perfecto da 10', () => {
    const tens = Object.fromEntries(KATA_CRITERION_KEYS.map((key) => [key, 10])) as Record<string, number>
    expect(averageKataCriteria(tens)).toBe(10)
  })

  it('ignora criterios faltantes y no rompe', () => {
    // Solo el bloque técnico completo → 8*0.7 = 5.6
    const tecnicoOnly: Record<string, number> = {}
    for (const block of KATA_RUBRIC) {
      if (block.key !== 'TECNICO') continue
      for (const criterion of block.criteria) tecnicoOnly[criterion.key] = 8
    }
    expect(averageKataCriteria(tecnicoOnly)).toBe(5.6)
  })
})

describe('parseKataCriteria', () => {
  it('normaliza un JSON válido y descarta valores inválidos', () => {
    expect(parseKataCriteria({ POSTURAS: 8, TECNICAS: 11, OTRO: 'x' })).toEqual({ POSTURAS: 8 })
  })

  it('devuelve null para entradas no válidas', () => {
    expect(parseKataCriteria(null)).toBeNull()
    expect(parseKataCriteria([1, 2])).toBeNull()
    expect(parseKataCriteria({})).toBeNull()
  })
})
