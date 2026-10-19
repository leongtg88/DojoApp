import { describe, expect, it } from 'vitest'
import { DOJO_INFO } from '@/lib/auth-data'
import {
  DOJO_CLASSES,
  MOCK_BENEFITS,
  MOCK_FAQS,
  MOCK_GALLERY,
  MOCK_INSTRUCTORS,
  MOCK_TESTIMONIALS,
} from '@/lib/types'

// Contenido estático del sitio público (marketing): se valida su forma mínima
// para que un cambio accidental no deje secciones vacías.
describe('datos estáticos del sitio', () => {
  it('DOJO_INFO expone los datos de contacto', () => {
    expect(DOJO_INFO.name).toBe('Tosei Gusoku Dojo')
    expect(DOJO_INFO.whatsappLink).toMatch(/^https:\/\/wa\.me\//)
    expect(DOJO_INFO.web).toMatch(/^https:\/\//)
  })

  it('los catálogos de contenido no están vacíos', () => {
    expect(MOCK_BENEFITS.length).toBeGreaterThan(0)
    expect(MOCK_INSTRUCTORS.length).toBeGreaterThan(0)
    expect(MOCK_TESTIMONIALS.length).toBeGreaterThan(0)
    expect(MOCK_FAQS.length).toBeGreaterThan(0)
    expect(MOCK_GALLERY.length).toBeGreaterThan(0)
    expect(DOJO_CLASSES.length).toBeGreaterThan(0)
  })

  it('los identificadores de contenido son únicos', () => {
    const ids = [...MOCK_BENEFITS, ...MOCK_INSTRUCTORS, ...MOCK_TESTIMONIALS, ...MOCK_FAQS, ...MOCK_GALLERY].map(
      (item) => item.id,
    )
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('cada clase declara al menos un horario', () => {
    for (const dojoClass of DOJO_CLASSES) {
      expect(dojoClass.schedule.length).toBeGreaterThan(0)
    }
  })
})
