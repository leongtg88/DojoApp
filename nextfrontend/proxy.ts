import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { buildLegacyStudentRedirect } from '@/lib/navigation/legacy-redirects'

export default auth((request) => {
  // UX-B1: las rutas antiguas deben ser 308 reales, no un redirect de cliente
  // después de que el layout del dashboard haya empezado a transmitir.
  const legacyRedirect = buildLegacyStudentRedirect(request.nextUrl.pathname, request.nextUrl.search)
  if (legacyRedirect) {
    return NextResponse.redirect(new URL(legacyRedirect, request.url), 308)
  }

  if (request.auth?.user) {
    return NextResponse.next()
  }

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)

  return NextResponse.redirect(loginUrl)
})

export const config = {
  // El grupo de rutas (dashboard) expone las mismas páginas también en sus
  // rutas raíz (/admin, /estudiante, /instructor), así que se protegen ambas.
  matcher: ['/dashboard/:path*', '/admin/:path*', '/estudiante/:path*', '/instructor/:path*', '/ajustes'],
}