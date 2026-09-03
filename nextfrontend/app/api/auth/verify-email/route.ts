import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const rawToken = request.nextUrl.searchParams.get('token')

  if (!rawToken) {
    return NextResponse.json({ error: 'Token de verificación ausente' }, { status: 400 })
  }

  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
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