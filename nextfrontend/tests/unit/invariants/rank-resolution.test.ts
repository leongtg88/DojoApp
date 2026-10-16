import { describe, expect, it } from 'vitest'
import { pickStudentRank } from '@/lib/dashboard/rank-resolution'

// INV-02 · El grado se resuelve por programa (ADULT/YOUTH).
// Regresión: para un niño con grado "Amarillo" el admin tomaba el de ADULT.
const ranks = [
  { id: 'adult-amarillo', name: 'Amarillo', program: 'ADULT' as const, order: 2, schoolId: null },
  { id: 'youth-amarillo', name: 'Amarillo', program: 'YOUTH' as const, order: 3, schoolId: null },
  { id: 'youth-blanco', name: 'Blanco', program: 'YOUTH' as const, order: 1, schoolId: null },
]

describe('INV-02 · el grado se resuelve por programa', () => {
  it('para un niño con "Amarillo" toma el de YOUTH, no el de ADULT', () => {
    const rank = pickStudentRank(ranks, { currentRank: 'Amarillo', currentRankId: null, studentProgram: 'YOUTH', schoolId: 's1' })
    expect(rank?.id).toBe('youth-amarillo')
  })

  it('prioriza el vínculo por currentRankId', () => {
    const rank = pickStudentRank(ranks, { currentRank: 'Amarillo', currentRankId: 'adult-amarillo', studentProgram: 'YOUTH', schoolId: 's1' })
    expect(rank?.id).toBe('adult-amarillo')
  })

  it('prefiere el grado de la escuela sobre el global', () => {
    const withSchool = [
      { id: 'global', name: 'Verde', program: 'ADULT' as const, order: 6, schoolId: null },
      { id: 'school', name: 'Verde', program: 'ADULT' as const, order: 6, schoolId: 's1' },
    ]
    const rank = pickStudentRank(withSchool, { currentRank: 'Verde', currentRankId: null, studentProgram: 'ADULT', schoolId: 's1' })
    expect(rank?.id).toBe('school')
  })

  it('devuelve null si no hay coincidencias', () => {
    expect(pickStudentRank(ranks, { currentRank: 'Rojo', currentRankId: null, studentProgram: 'ADULT', schoolId: 's1' })).toBeNull()
  })
})
