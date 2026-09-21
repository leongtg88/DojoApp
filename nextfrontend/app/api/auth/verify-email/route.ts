import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { consumeRateLimit, getClientIp, rateLimitResponse } from '@/lib/security/rate-limit'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const rawToken = request.nextUrl.searchParams.get('token')

  if (!rawToken) {
    return NextResponse.json({ error: 'Token de verificación ausente' }, { status: 400 })
  }

  const tokenHash = createHash('sha256').update(rawToken).digest('hex')

  const ip = getClientIp(request.headers)
  const ipAttempt = await consumeRateLimit(`verify:${ip}`, {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  })
  if (!ipAttempt.allowed) {
    return rateLimitResponse(ipAttempt.retryAfterSeconds, 'Demasiados intentos. Inténtalo de nuevo más tarde.')
  }

  const tokenAttempt = await consumeRateLimit(`verify-token:${tokenHash}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  })
  if (!tokenAttempt.allowed) {
    return rateLimitResponse(tokenAttempt.retryAfterSeconds, 'Demasiados intentos para este enlace. Inténtalo de nuevo más tarde.')
  }

  const verificationToken = await db.emailVerificationToken.findUnique({
    where: { token: tokenHash },
    include: { user: true },
  })

  if (
    !verificationToken ||
    verificationToken.usedAt ||
    verificationToken.expiresAt < new Date()
  ) {
    return NextResponse.json(
      { error: 'El enlace no es válido o ya expiró' },
      { status: 400 },
    )
  }

  await db.$transaction([
    db.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: new Date() },
    }),
    db.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    }),
  ])

  return NextResponse.json({ success: true, message: 'Correo verificado correctamente' })
}