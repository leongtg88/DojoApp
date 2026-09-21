import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((request) => {
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
  matcher: ['/dashboard/:path*', '/admin/:path*', '/estudiante/:path*', '/instructor/:path*'],
}