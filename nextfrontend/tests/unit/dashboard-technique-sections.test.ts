import { describe, expect, it } from 'vitest'
import { buildTechniqueSections } from '@/lib/dashboard/technique-sections'
import type { CategorizedTechnique } from '@/lib/dashboard/technique-sections'

type Item = CategorizedTechnique & { name: string }

const item = (overrides: Partial<Item> & Pick<Item, 'name' | 'category'>): Item => ({
  kihonCategory: null,
  kumiteCategory: null,
  ...overrides,
})

describe('secciones de técnicas (technique-sections)', () => {
  it('agrupa por sub-categoría y ordena por `order`', () => {
    const sections = buildTechniqueSections<Item>([
      item({ name: 'Age Uke', category: 'KIHON', kihonCategory: 'UKE_WAZA', order: 2 }),
      item({ name: 'Gedan Barai', category: 'KIHON', kihonCategory: 'UKE_WAZA', order: 1 }),
      item({ name: 'Pinan Shodan', category: 'KATA', order: 1 }),
      item({ name: 'Bunkai 1', category: 'BUNKAI' }),
    ])

    const keys = sections.map((section) => section.key)
    expect(keys).toContain('KIHON:UKE_WAZA')
    expect(keys).toContain('KATA')
    expect(keys).toContain('BUNKAI')

    const uke = sections.find((section) => section.key === 'KIHON:UKE_WAZA')!
    expect(uke.items.map((entry) => entry.name)).toEqual(['Gedan Barai', 'Age Uke'])
  })

  it('separa el kihon/kumite sin sub-categoría', () => {
    const sections = buildTechniqueSections<Item>([
      item({ name: 'Kihon suelto', category: 'KIHON' }),
      item({ name: 'Kumite suelto', category: 'KUMITE' }),
    ])

    expect(sections.map((section) => section.key)).toEqual(['KIHON:__none__', 'KUMITE:__none__'])
  })

  it('sin técnicas devuelve una lista vacía', () => {
    expect(buildTechniqueSections<Item>([])).toEqual([])
  })
})
