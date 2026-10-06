import 'server-only'
import { NextResponse } from 'next/server'

/**
 * Verifica que una petición de escritura provenga del mismo origen. Complementa
 * la protección de cookies (`SameSite=Lax`) y bloquea intentos CSRF con `Origin`
 * cruzado. Si no hay `Origin` (peticiones server-side, herramientas internas) se
 * permite: el navegador siempre lo envía en POST/PATCH/DELETE cross-origin.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true

  const host = request.headers.get('host')
  if (!host) return false

  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export function sameOriginResponse(): NextResponse {
  return NextResponse.json({ error: 'Origen no permitido', code: 'BAD_ORIGIN' }, { status: 403 })
}
