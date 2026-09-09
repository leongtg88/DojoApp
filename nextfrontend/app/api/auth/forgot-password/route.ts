import { randomBytes, createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const parsed = forgotPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Ingresa un correo electrónico válido' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, email: true },
    })

    // No revelamos si el correo existe por seguridad; el flujo de recuperación
    // solo continúa para cuentas registradas.
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.',
      })
    }

    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await db.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    })

    await db.passwordResetToken.create({
      data: {
        token: tokenHash,
        userId: user.id,
        expiresAt,
      },
    })

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTDOJO_APP ?? 'http://localhost:3000'}/restablecer-password?token=${rawToken}`
    const hasEmailConfig = Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)

    if (!hasEmailConfig && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'El servicio de correo no está configurado' },
        { status: 503 },
      )
    }

    if (!hasEmailConfig) {
      return NextResponse.json({
        success: true,
        message: 'Cuenta encontrada. Usa el enlace de recuperación de desarrollo.',
        ...(process.env.NODE_ENV !== 'production' ? { resetUrl } : {}),
      })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const emailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: [user.email],
      subject: 'Restablece tu contraseña de Tosei Gusoku',
      html: `<p>Recibimos una solicitud para restablecer tu contraseña de Tosei Gusoku.</p><p><a href="${resetUrl}">Restablecer mi contraseña</a></p><p>Este enlace vence en 1 hora. Si no solicitaste este cambio, ignora este correo.</p>`,
    })

    if (emailResult.error) {
      console.error('Error enviando recuperación:', emailResult.error)
      return NextResponse.json(
        { error: 'No se pudo enviar el correo de recuperación' },
        { status: 502 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.',
    })
  } catch (err: unknown) {
    console.error('Error en recuperación de contraseña:', err)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}