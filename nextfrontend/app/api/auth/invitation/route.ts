import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '@/lib/db'
import { Role } from '@/lib/generated/prisma'

export const runtime = 'nodejs'

const invitationSchema = z.object({
  token: z.string().trim().min(20).max(512),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
})

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const parsed = invitationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos de registro inválidos' }, { status: 400 })
    }

    const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex')

    const invitation = await db.studentInvitationToken.findUnique({
      where: { token: tokenHash },
      select: { id: true, studentId: true, email: true, expiresAt: true, usedAt: true, student: { select: { userId: true, schoolId: true, branchId: true, firstName: true, lastName: true } } },
    })

    if (!invitation) {
      return NextResponse.json({ error: 'La invitación no es válida o ya fue utilizada' }, { status: 404 })
    }

    if (invitation.usedAt) {
      return NextResponse.json({ error: 'Esta invitación ya fue utilizada' }, { status: 409 })
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Esta invitación ha expirado. Solicita un nuevo enlace al administrador.' }, { status: 410 })
    }

    if (parsed.data.email !== invitation.email) {
      return NextResponse.json({ error: 'El correo no coincide con el de la invitación. Verifica el enlace recibido.' }, { status: 400 })
    }

    if (invitation.student.userId) {
      return NextResponse.json({ error: 'Este estudiante ya tiene una cuenta de acceso' }, { status: 409 })
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

    const passwordHash = await bcrypt.hash(parsed.data.password, 12)

    await db.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: {
          name: `${invitation.student.firstName} ${invitation.student.lastName}`,
          email: parsed.data.email,
          emailVerified: new Date(),
          passwordHash,
          role: Role.STUDENT,
          roles: [Role.STUDENT],
          schoolId: invitation.student.schoolId,
          branchId: invitation.student.branchId,
        },
        select: { id: true },
      })

      await transaction.student.update({
        where: { id: invitation.studentId },
        data: { userId: createdUser.id },
      })

      await transaction.studentInvitationToken.update({
        where: { id: invitation.id },
        data: { usedAt: new Date(), usedByUserId: createdUser.id },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Cuenta creada correctamente. Ya puedes iniciar sesión.',
    })
  } catch (err: unknown) {
    console.error('Error aceptando invitación:', err)
    return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 500 })
  }
}