import { describe, expect, it } from 'vitest'
import { SITE } from '@/lib/seo'
import { buildLlmsFullTxt, buildLlmsTxt } from '@/lib/seo/llms'

// Mapa del sitio para LLM (llms.txt).
describe('llms.txt', () => {
  it('incluye nombre, páginas principales, legales y contacto', () => {
    const txt = buildLlmsTxt([])
    expect(txt).toContain(`# ${SITE.name}`)
    expect(txt).toContain('/nosotros')
    expect(txt).toContain('/privacidad')
    expect(txt).toContain(SITE.email)
    expect(txt).toContain('## Optional')
  })

  it('lista los artículos cuando existen', () => {
    const txt = buildLlmsTxt([{ title: 'Kata', slug: 'kata', excerpt: 'un resumen' }])
    expect(txt).toContain('## Artículos')
    expect(txt).toContain('/blog/kata')
    expect(txt).toContain('un resumen')
  })

  it('la versión full incluye contenido de artículos y programas', () => {
    const full = buildLlmsFullTxt([{ title: 'Kata', slug: 'kata', excerpt: 'resumen', content: 'contenido extenso del artículo' }])
    expect(full).toContain('## Programas y precios')
    expect(full).toContain('contenido extenso del artículo')
    expect(full).toContain('/blog/kata')
  })

  it('sin artículos no agrega la sección de artículos', () => {
    const full = buildLlmsFullTxt([])
    expect(full).not.toContain('## Artículos completos')
  })
})
