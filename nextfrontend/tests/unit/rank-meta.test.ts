import { describe, expect, it } from 'vitest'
import { rankForKyuDan, rankForOrder } from '@/lib/curriculum/programs'

describe('rankForOrder', () => {
  it('resuelve un grado oficial por su posición', () => {
    const rank = rankForOrder('ADULT', 3)
    expect(rank?.name).toBe('Naranja')
    expect(rank?.kyuDan).toBe('9TH KYU')
  })

  it('devuelve null para posiciones inválidas', () => {
    expect(rankForOrder('ADULT', 0)).toBeNull()
    expect(rankForOrder('ADULT', 1.5)).toBeNull()
    expect(rankForOrder('ADULT', 999)).toBeNull()
  })
})

describe('rankForKyuDan', () => {
  it('resuelve nombre japonés y kanji por la etiqueta Kyū/Dan', () => {
    const rank = rankForKyuDan('ADULT', '9TH KYU')
    expect(rank?.japaneseName).toBe('Kyu-kyu')
    expect(rank?.kanji).toBe('九級')
  })

  it('resuelve grados Dan', () => {
    const rank = rankForKyuDan('ADULT', 'SHODAN (1ST DAN)')
    expect(rank?.name).toBe('Shodan')
    expect(rank?.japaneseName).toBe('1st Dan')
    expect(rank?.kanji).toBe('初段')
  })

  it('ignora espacios sobrantes al comparar', () => {
    const rank = rankForKyuDan('YOUTH', ' 6TH KYU ')
    expect(rank).not.toBeNull()
    expect(rank?.name).toBe('Verde')
  })

  it('es insensible a mayúsculas/minúsculas', () => {
    expect(rankForKyuDan('ADULT', '9th kyu')?.order).toBe(3)
  })

  it('devuelve null para etiquetas vacías o desconocidas', () => {
    expect(rankForKyuDan('ADULT', '')).toBeNull()
    expect(rankForKyuDan('ADULT', 'NOPE')).toBeNull()
  })
})
