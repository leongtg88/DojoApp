import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthenticationResponse, type AuthenticationResponseJSON } from '@simplewebauthn/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { consumeRateLimit, getClientIp, rateLimitResponse, resetRateLimit } from '@/lib/security/rate-limit'
import { userHasDashboardAccess } from '@/lib/auth/login-gate'
import {
  bytesFromBase64Url,
  clearChallengeCookie,
  readChallengeCookie,
  resolveWebAuthnRp,
  setLoginTicketCookie,
} from '@/lib/auth/webauthn'

export const runtime = 'nodejs'

const bodySchema = z.object({
  response: z.unknown(),
})

// Verifica la aserción del autenticador y, si es válida y la cuenta tiene
// acceso, deja un ticket firmado en una cookie httpOnly. El ticket lo consume
// el provider `webauthn` de NextAuth para emitir la sesión normal.
export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const attempt = await consumeRateLimit(`wa-login-verify:${ip}`, {
    limit: 40,
    windowMs: 15 * 60 * 1000,
  })
  if (!attempt.allowed) {
    return rateLimitResponse(attempt.retryAfterSeconds, 'Demasiados intentos. Inténtalo de nuevo más tarde.')
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || typeof parsed.data.response !== 'object' || parsed.data.response === null) {
    return NextResponse.json({ error: 'Datos de autenticación inválidos' }, { status: 400 })
  }

  const response = parsed.data.response as AuthenticationResponseJSON

  const stored = await db.webAuthnCredential.findUnique({
    where: { credentialId: response.id },
    include: { user: { select: { id: true, email: true, emailVerified: true, roles: true, sessionVersion: true } } },
  })

  if (!stored) {
    return NextResponse.json({ error: 'No hay una huella registrada para este dispositivo.' }, { status: 404 })
  }

  const challenge = await readChallengeCookie()
  if (!challenge || challenge.purpose !== 'login') {
    return NextResponse.json({ error: 'El desafío expiró. Inténtalo de nuevo.' }, { status: 400 })
  }

  const { rpID, origin } = resolveWebAuthnRp(request)

  let verification
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: stored.credentialId,
        publicKey: bytesFromBase64Url(stored.publicKey),
        counter: stored.counter,
        transports: stored.transports,
      },
      requireUserVerification: true,
    })
  } catch {
    return NextResponse.json({ error: 'No se pudo verificar la huella. Inténtalo de nuevo.' }, { status: 400 })
  }

  await clearChallengeCookie()

  if (!verification.verified) {
    return NextResponse.json({ error: 'No se pudo verificar la huella. Inténtalo de nuevo.' }, { status: 400 })
  }

  await db.webAuthnCredential.update({
    where: { id: stored.id },
    data: { counter: verification.authenticationInfo.newCounter, lastUsedAt: new Date() },
  })

  const user = stored.user

  if (!user.emailVerified) {
    return NextResponse.json({ error: 'Tu correo aún no está verificado.' }, { status: 403 })
  }

  if (!(await userHasDashboardAccess({ id: user.id, roles: user.roles }))) {
    return NextResponse.json({ error: 'Tu cuenta no tiene acceso al dashboard.' }, { status: 403 })
  }

  await resetRateLimit(`login-fail:${user.email}`)

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: 'webauthn.login',
      targetType: 'WebAuthnCredential',
      targetId: stored.id,
      ip,
    },
  }).catch(() => undefined)

  await setLoginTicketCookie(user.id, user.sessionVersion)

  return NextResponse.json({ verified: true, email: user.email })
}
