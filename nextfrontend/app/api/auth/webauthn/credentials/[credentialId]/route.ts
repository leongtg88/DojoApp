import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getClientIp } from '@/lib/security/rate-limit'

export const runtime = 'nodejs'

interface CredentialRouteContext {
  params: Promise<{ credentialId: string }>
}

const patchSchema = z.object({
  deviceName: z.string().trim().min(1).max(60),
})

async function resolveOwnedCredential(sessionUserId: string, credentialId: string) {
  const credential = await db.webAuthnCredential.findUnique({
    where: { id: credentialId },
    select: { id: true, userId: true },
  })

  if (!credential || credential.userId !== sessionUserId) {
    return null
  }

  return credential
}

// Renombra el dispositivo (nombre visible en la lista de Ajustes).
export async function PATCH(request: NextRequest, { params }: CredentialRouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Nombre de dispositivo inválido' }, { status: 400 })
  }

  const { credentialId } = await params
  const credential = await resolveOwnedCredential(session.user.id, credentialId)
  if (!credential) {
    return NextResponse.json({ error: 'Dispositivo no encontrado' }, { status: 404 })
  }

  await db.webAuthnCredential.update({
    where: { id: credential.id },
    data: { deviceName: parsed.data.deviceName },
  })

  return NextResponse.json({ ok: true })
}

// Elimina una huella / Face ID registrada por el usuario actual.
export async function DELETE(request: NextRequest, { params }: CredentialRouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { credentialId } = await params
  const credential = await resolveOwnedCredential(session.user.id, credentialId)
  if (!credential) {
    return NextResponse.json({ error: 'Dispositivo no encontrado' }, { status: 404 })
  }

  await db.webAuthnCredential.delete({ where: { id: credential.id } })

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: 'webauthn.delete',
      targetType: 'WebAuthnCredential',
      targetId: credential.id,
      ip: getClientIp(request.headers),
    },
  }).catch(() => undefined)

  return NextResponse.json({ ok: true })
}
