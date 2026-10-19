import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// F0-02 · Guardarraíl del middleware: las rutas del dashboard (y sus alias raíz)
// quedan detrás del `auth()` de Next, que redirige a /login sin sesión.
const proxySource = readFileSync(fileURLToPath(new URL('../../proxy.ts', import.meta.url)), 'utf8')

describe('middleware de protección del dashboard', () => {
  it('incluye en el matcher el dashboard y sus alias raíz', () => {
    for (const pattern of ['/dashboard/:path*', '/admin/:path*', '/estudiante/:path*', '/instructor/:path*', '/ajustes']) {
      expect(proxySource).toContain(`'${pattern}'`)
    }
  })

  it('redirige a /login preservando el callbackUrl cuando no hay sesión', () => {
    expect(proxySource).toMatch(/request\.auth\?\.user/)
    expect(proxySource).toMatch(/new URL\('\/login'/)
    expect(proxySource).toMatch(/callbackUrl/)
    expect(proxySource).toMatch(/NextResponse\.redirect\(loginUrl\)/)
  })
})
