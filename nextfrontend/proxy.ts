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
  matcher: ['/dashboard/:path*'],
}