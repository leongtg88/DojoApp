import { NextRequest, NextResponse } from 'next/server'
import { verifyRegistrationResponse, type RegistrationResponseJSON } from '@simplewebauthn/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getClientIp } from '@/lib/security/rate-limit'
import { bytesToBase64Url, clearChallengeCookie, readChallengeCookie, resolveWebAuthnRp } from '@/lib/auth/webauthn'

export const runtime = 'nodejs'

const bodySchema = z.object({
  response: z.unknown(),
  deviceName: z.string().trim().max(60).optional(),
})

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || typeof parsed.data.response !== 'object' || parsed.data.response === null) {
    return NextResponse.json({ error: 'Datos de registro inválidos' }, { status: 400 })
  }

  const challenge = await readChallengeCookie()
  if (!challenge || challenge.purpose !== 'register' || challenge.userId !== session.user.id) {
    return NextResponse.json({ error: 'El desafío expiró. Inténtalo de nuevo.' }, { status: 400 })
  }

  const { rpID, origin } = resolveWebAuthnRp(request)

  let verification
  try {
    verification = await verifyRegistrationResponse({
      response: parsed.data.response as RegistrationResponseJSON,
      expectedChallenge: challenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    })
  } catch {
    return NextResponse.json({ error: 'No se pudo verificar el dispositivo.' }, { status: 400 })
  }

  await clearChallengeCookie()

  if (!verification.verified) {
    return NextResponse.json({ error: 'No se pudo verificar el dispositivo.' }, { status: 400 })
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo

  const duplicate = await db.webAuthnCredential.findUnique({
    where: { credentialId: credential.id },
    select: { id: true },
  })
  if (duplicate) {
    return NextResponse.json({ error: 'Este dispositivo ya está registrado.' }, { status: 409 })
  }

  const created = await db.webAuthnCredential.create({
    data: {
      userId: session.user.id,
      credentialId: credential.id,
      publicKey: bytesToBase64Url(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports ?? [],
      deviceName: parsed.data.deviceName ?? null,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
    },
    select: { id: true },
  })

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: 'webauthn.register',
      targetType: 'WebAuthnCredential',
      targetId: created.id,
      ip: getClientIp(request.headers),
      detail: { deviceType: credentialDeviceType, backedUp: credentialBackedUp },
    },
  }).catch(() => undefined)

  return NextResponse.json({ verified: true, credentialId: credential.id })
}
