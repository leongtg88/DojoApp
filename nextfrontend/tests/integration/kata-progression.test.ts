import { beforeEach, describe, expect, it } from 'vitest'

const { resetDb } = await import('./db')
const { createSchool, createTechnique, createRank } = await import('./fixtures')
const { resolveProgressionKataIds } = await import('@/lib/dashboard/kata-curriculum')

beforeEach(resetDb)

// INV-07 · El "próximo grado"/progresión tiene una sola fuente.
describe('INV-07 · progresión de katas (grado + siguiente, mismo programa)', () => {
  it('devuelve las katas del grado actual y del siguiente', async () => {
    const school = await createSchool()
    const blanco = await createTechnique('Blanco Kata', school.id)
    const amarillo = await createTechnique('Amarillo Kata', school.id)
    const naranja = await createTechnique('Naranja Kata', school.id)

    await createRank({ schoolId: school.id, program: 'ADULT', order: 1, name: 'Blanco', kataIds: [blanco.id] })
    await createRank({ schoolId: school.id, program: 'ADULT', order: 2, name: 'Amarillo', kataIds: [amarillo.id] })
    await createRank({ schoolId: school.id, program: 'ADULT', order: 3, name: 'Naranja', kataIds: [naranja.id] })

    const ids = await resolveProgressionKataIds({ schoolId: school.id, program: 'ADULT', order: 1 })

    expect(new Set(ids)).toEqual(new Set([blanco.id, amarillo.id]))
  })

  it('no cruza programas (YOUTH vs ADULT)', async () => {
    const school = await createSchool()
    const adulto = await createTechnique('Adulto Kata', school.id)
    const nino = await createTechnique('Niño Kata', school.id)

    await createRank({ schoolId: school.id, program: 'ADULT', order: 2, name: 'Amarillo', kataIds: [adulto.id] })
    await createRank({ schoolId: school.id, program: 'YOUTH', order: 2, name: 'Amarillo', kataIds: [nino.id] })

    const ids = await resolveProgressionKataIds({ schoolId: school.id, program: 'YOUTH', order: 2 })

    expect(ids).toEqual([nino.id])
  })
})
