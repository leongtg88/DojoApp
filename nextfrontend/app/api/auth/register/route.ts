import { randomBytes, createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { Resend } from 'resend'
import { db } from '@/lib/db'
import { Role } from '@prisma/client'

export const runtime = 'nodejs'

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  dateOfBirth: z.coerce.date(),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
})

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos de registro inválidos' }, { status: 400 })
    }

    if (parsed.data.dateOfBirth > new Date()) {
      return NextResponse.json(
        { error: 'La fecha de nacimiento no puede estar en el futuro' },
        { status: 400 },
      )
    }

    const existingUser = await db.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta registrada con este correo electrónico' },
        { status: 409 },
      )
    }

    const branch = await db.branch.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true, schoolId: true },
    })

    if (!branch) {
      return NextResponse.json(
        { error: 'La escuela todavía no está configurada' },
        { status: 503 },
      )
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12)
    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const nameParts = parsed.data.name.split(/\s+/)
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || firstName

    const user = await db.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          passwordHash,
          role: Role.STUDENT,
          schoolId: branch.schoolId,
          branchId: branch.id,
          studentProfile: {
            create: {
              schoolId: branch.schoolId,
              branchId: branch.id,
              firstName,
              lastName,
              dateOfBirth: parsed.data.dateOfBirth,
            },
          },
        },
        select: { id: true, email: true },
      })

      await transaction.emailVerificationToken.deleteMany({
        where: { userId: createdUser.id },
      })

      await transaction.emailVerificationToken.create({
        data: {
          token: tokenHash,
          userId: createdUser.id,
          expiresAt,
        },
      })

      return createdUser
    })

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/verificar-email?token=${rawToken}`
    const hasEmailConfig = Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)

    if (!hasEmailConfig && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'El servicio de correo no está configurado' },
        { status: 503 },
      )
    }

    if (hasEmailConfig) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const emailResult = await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: [user.email],
        subject: 'Verifica tu cuenta de Tosei Gusoku',
        html: `<p>Confirma tu correo para activar tu cuenta de Tosei Gusoku.</p><p><a href="${verificationUrl}">Verificar mi correo</a></p><p>Este enlace vence en 24 horas.</p>`,
      })

      if (emailResult.error) {
        console.error('Error enviando verificación:', emailResult.error)
        return NextResponse.json(
          { error: 'La cuenta fue creada, pero no se pudo enviar el correo de verificación' },
          { status: 502 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: hasEmailConfig
        ? 'Cuenta creada. Revisa tu correo para verificarla.'
        : 'Cuenta creada. Usa el enlace de verificación de desarrollo.',
      user,
      ...(process.env.NODE_ENV !== 'production' ? { verificationUrl } : {}),
    })
  } catch (err: unknown) {
    console.error('Error en registro:', err)
    return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 500 })
  }
}
