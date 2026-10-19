import { describe, expect, it } from 'vitest'
import { comprimirImagen } from '@/lib/image-compression'

const file = (name: string, type: string) => new File([new Uint8Array([1, 2, 3])], name, { type })

// Compresión de imágenes (guardas; en node no hay `document`).
describe('comprimirImagen (guardas)', () => {
  it('devuelve el mismo archivo si no es una imagen', async () => {
    const pdf = file('documento.pdf', 'application/pdf')
    expect(await comprimirImagen(pdf)).toBe(pdf)
  })

  it('no recomprime GIF ni SVG', async () => {
    const gif = file('anim.gif', 'image/gif')
    const svg = file('logo.svg', 'image/svg+xml')
    expect(await comprimirImagen(gif)).toBe(gif)
    expect(await comprimirImagen(svg)).toBe(svg)
  })

  it('sin `document` (SSR/node) devuelve el original', async () => {
    const png = file('foto.png', 'image/png')
    expect(await comprimirImagen(png)).toBe(png)
  })
})
