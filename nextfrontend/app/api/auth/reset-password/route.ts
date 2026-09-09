import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
})

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const parsed = resetPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'El enlace es inválido o la contraseña no cumple los requisitos (mínimo 8 caracteres)' },
        { status: 400 },
      )
    }

    const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex')
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token: tokenHash },
      include: { user: { select: { id: true } } },
    })

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: 'Este enlace de recuperación es inválido o ya expiró. Solicita uno nuevo.' },
        { status: 400 },
      )
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12)

    await db.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      })
      await transaction.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      })
      await transaction.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId, usedAt: null },
      })
    })

    return NextResponse.json({ success: true, message: 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.' })
  } catch (err: unknown) {
    console.error('Error restableciendo contraseña:', err)
    return NextResponse.json({ error: 'Error al restablecer la contraseña' }, { status: 500 })
  }
}