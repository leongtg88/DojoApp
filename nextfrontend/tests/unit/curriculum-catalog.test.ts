import { describe, expect, it } from 'vitest'
import { KIHON_CATEGORIES_ORDER, KIHON_TECHNIQUES } from '@/lib/curriculum/kihon'
import { KUMITE_CATEGORIES_ORDER, KUMITE_TECHNIQUES } from '@/lib/curriculum/kumite'

function sequentialOrders(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index + 1)
}

describe('catálogo de kihon', () => {
  it('tiene ids únicos', () => {
    const ids = KIHON_TECHNIQUES.map((technique) => technique.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('usa un orden secuencial sin huecos (lo requiere el script de sincronización)', () => {
    const orders = KIHON_TECHNIQUES.map((technique) => technique.order).sort((a, b) => a - b)
    expect(orders).toEqual(sequentialOrders(KIHON_TECHNIQUES.length))
  })

  it('cada técnica usa una categoría declarada', () => {
    for (const technique of KIHON_TECHNIQUES) {
      expect(KIHON_CATEGORIES_ORDER).toContain(technique.kihonCategory)
    }
  })

  it('solo las combinaciones (renzoku/ido) quedan sin repeticiones por defecto', () => {
    const withoutRepetitions = KIHON_TECHNIQUES.filter((technique) => technique.repetitionsCount === undefined)
    expect(withoutRepetitions.length).toBeGreaterThan(0)
    expect(
      withoutRepetitions.every(
        (technique) => technique.kihonCategory === 'RENZOKU_WAZA' || technique.kihonCategory === 'IDO_KIHON',
      ),
    ).toBe(true)
  })
})

describe('catálogo de kumite', () => {
  it('tiene ids únicos', () => {
    const ids = KUMITE_TECHNIQUES.map((technique) => technique.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('usa un orden secuencial sin huecos', () => {
    const orders = KUMITE_TECHNIQUES.map((technique) => technique.order).sort((a, b) => a - b)
    expect(orders).toEqual(sequentialOrders(KUMITE_TECHNIQUES.length))
  })

  it('cada técnica usa una categoría declarada', () => {
    for (const technique of KUMITE_TECHNIQUES) {
      expect(KUMITE_CATEGORIES_ORDER).toContain(technique.kumiteCategory)
    }
  })
})
