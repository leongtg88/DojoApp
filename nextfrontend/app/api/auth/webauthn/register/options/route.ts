import { NextRequest, NextResponse } from 'next/server'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getClientIp, rateLimitResponse, consumeRateLimit } from '@/lib/security/rate-limit'
import { resolveWebAuthnRp, setChallengeCookie } from '@/lib/auth/webauthn'

export const runtime = 'nodejs'

// Opciones para registrar una nueva huella / Face ID. Requiere sesión activa:
// el usuario ya está dentro y desde Ajustes vincula este dispositivo.
export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const ip = getClientIp(request.headers)
  const attempt = await consumeRateLimit(`wa-register:${session.user.id}:${ip}`, {
    limit: 20,
    windowMs: 15 * 60 * 1000,
  })
  if (!attempt.allowed) {
    return rateLimitResponse(attempt.retryAfterSeconds, 'Demasiados intentos. Inténtalo de nuevo más tarde.')
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      webauthnCredentials: { select: { credentialId: true, transports: true } },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { rpID, rpName } = resolveWebAuthnRp(request)

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.email,
    userDisplayName: user.name ?? user.email,
    userID: new TextEncoder().encode(user.id),
    attestationType: 'none',
    // Evita registrar dos veces el mismo autenticador físico.
    excludeCredentials: user.webauthnCredentials.map((credential) => ({
      id: credential.credentialId,
      transports: credential.transports,
    })),
    authenticatorSelection: {
      // `residentKey: required` crea una "passkey" (clave residente) que permite
      // el ingreso sin escribir el correo. `platform` limita a la huella/rostro
      // o PIN del propio dispositivo.
      residentKey: 'required',
      requireResidentKey: true,
      userVerification: 'required',
      authenticatorAttachment: 'platform',
    },
  })

  await setChallengeCookie(options.challenge, 'register', user.id)

  return NextResponse.json(options)
}
