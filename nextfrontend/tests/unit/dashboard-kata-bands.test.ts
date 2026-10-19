import { describe, expect, it } from 'vitest'
import { bandForOrder, beltChipsForLevels } from '@/lib/dashboard/kata-bands'

describe('tramos de kata (kata-bands)', () => {
  it('asigna el tramo según el orden del grado por programa', () => {
    expect(bandForOrder('ADULT', 1)).toBe('PRINCIPIANTE')
    expect(bandForOrder('ADULT', 3)).toBe('PRINCIPIANTE')
    expect(bandForOrder('ADULT', 4)).toBe('INTERMEDIO')
    expect(bandForOrder('ADULT', 20)).toBe('AVANZADO')
    expect(bandForOrder('YOUTH', 6)).toBe('INTERMEDIO')
    expect(bandForOrder('YOUTH', 13)).toBe('AVANZADO')
  })

  it('beltChipsForLevels deduplica colores y ordena por grado', () => {
    const chips = beltChipsForLevels([
      { gradeOrder: 5, beltColor: '#FFFFFF' },
      { gradeOrder: 3, beltColor: '#FFEB3B' },
      { gradeOrder: 4, beltColor: '#ffffff' },
      { gradeOrder: 2, beltColor: null },
    ])

    expect(chips.map((chip) => chip.beltColor)).toEqual(['#3f3f46', '#FFEB3B', '#FFFFFF'])
  })
})
