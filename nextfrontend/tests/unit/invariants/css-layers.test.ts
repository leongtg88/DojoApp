import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// INV-05 · Las reglas globales que pisan utilities (p. ej. `input { font-size }`)
// deben vivir dentro de `@layer` o `@media`, nunca en el nivel raíz sin capa.
const css = readFileSync(fileURLToPath(new URL('../../../app/globals.css', import.meta.url)), 'utf8')

const BARE_ELEMENT = /^(input|select|textarea|button)\b/

interface Frame {
  selector: string
  isGroup: boolean
  insideGroup: boolean
  bodyStart: number
}

/** Devuelve los selectores de elementos con `font-size` en el nivel raíz (sin capa ni media). */
function topLevelElementFontSizeRules(source: string): string[] {
  const clean = source.replace(/\/\*[\s\S]*?\*\//g, '')
  const stack: Frame[] = []
  const offenders: string[] = []
  let buffer = ''

  for (let index = 0; index < clean.length; index += 1) {
    const char = clean[index]

    if (char === '{') {
      const selector = buffer.trim()
      stack.push({
        selector,
        isGroup: selector.startsWith('@media') || selector.startsWith('@layer'),
        insideGroup: stack.some((frame) => frame.isGroup),
        bodyStart: index + 1,
      })
      buffer = ''
    } else if (char === '}') {
      const frame = stack.pop()
      if (frame && !frame.isGroup && !frame.insideGroup && BARE_ELEMENT.test(frame.selector)) {
        const body = clean.slice(frame.bodyStart, index)
        if (/font-size\s*:/.test(body)) offenders.push(frame.selector)
      }
      buffer = ''
    } else if (char === ';') {
      // Las sentencias `@import …;` / `@theme …;` no deben contaminar el próximo selector.
      buffer = ''
    } else {
      buffer += char
    }
  }

  return offenders
}

describe('INV-05 · reglas globales en @layer', () => {
  it('globals.css no tiene reglas de elemento con font-size fuera de @layer/@media', () => {
    expect(topLevelElementFontSizeRules(css)).toEqual([])
  })

  it('usa @layer para las reglas globales', () => {
    expect(css).toMatch(/@layer\s/)
  })

  it('detecta el anti-patrón cuando está en el nivel raíz (el guardarraíl muerde)', () => {
    const antiPattern = '@import "tailwindcss";\n\ninput, select, textarea { font-size: 16px; }\n'
    expect(topLevelElementFontSizeRules(antiPattern)).toEqual(['input, select, textarea'])
  })

  it('no marca la excepción intencional dentro de @media (iOS zoom)', () => {
    const allowed = '@media (max-width: 768px) {\n  input, select, textarea { font-size: 16px; }\n}\n'
    expect(topLevelElementFontSizeRules(allowed)).toEqual([])
  })
})
