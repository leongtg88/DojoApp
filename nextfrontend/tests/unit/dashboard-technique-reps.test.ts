import { describe, expect, it, vi } from 'vitest'

// `technique-reps` importa `db`, pero `targetRepetitionsFor` es pura: se aísla el
// cliente para no arrastrar la conexión a Postgres en las pruebas unitarias.
vi.mock('@/lib/db', () => ({ db: {} }))

import { targetRepetitionsFor } from '@/lib/dashboard/technique-reps'

// Fase 1 · F1-05 — Objetivo de repeticiones por tipo de técnica.
describe('targetRepetitionsFor', () => {
  it('kihon usa repetitionsCount', () => {
    expect(targetRepetitionsFor({ category: 'KIHON', repetitionsCount: 20, movementsCount: 5 })).toBe(20)
  })

  it('kata/kumite/bunkai usan movementsCount', () => {
    expect(targetRepetitionsFor({ category: 'KATA', repetitionsCount: null, movementsCount: 26 })).toBe(26)
    expect(targetRepetitionsFor({ category: 'KUMITE', repetitionsCount: 3, movementsCount: 4 })).toBe(4)
    expect(targetRepetitionsFor({ category: 'BUNKAI', repetitionsCount: null, movementsCount: 8 })).toBe(8)
  })

  it('devuelve null cuando falta el valor de referencia', () => {
    expect(targetRepetitionsFor({ category: 'KIHON', repetitionsCount: null, movementsCount: 5 })).toBeNull()
    expect(targetRepetitionsFor({ category: 'KATA', repetitionsCount: 1, movementsCount: null })).toBeNull()
  })
})
