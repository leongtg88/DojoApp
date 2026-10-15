import { NextRequest, NextResponse } from 'next/server'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { getClientIp, consumeRateLimit, rateLimitResponse } from '@/lib/security/rate-limit'
import { resolveWebAuthnRp, setChallengeCookie } from '@/lib/auth/webauthn'

export const runtime = 'nodejs'

// Opciones para iniciar sesión con huella. Sin `allowCredentials`: se pide al
// dispositivo que muestre sus "passkeys" residentes, de modo que el usuario
// entra con un toque sin escribir el correo.
export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const attempt = await consumeRateLimit(`wa-login-options:${ip}`, {
    limit: 60,
    windowMs: 15 * 60 * 1000,
  })
  if (!attempt.allowed) {
    return rateLimitResponse(attempt.retryAfterSeconds, 'Demasiados intentos. Inténtalo de nuevo más tarde.')
  }

  const { rpID } = resolveWebAuthnRp(request)

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'required',
  })

  await setChallengeCookie(options.challenge, 'login', null)

  return NextResponse.json(options)
}
