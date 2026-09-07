import { randomBytes, createHash } from 'node:crypto'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export const runtime = 'nodejs'

interface InviteRouteContext {
  params: Promise<{ studentId: string }>
}

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000

export async function POST(request: NextRequest, { params }: InviteRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { studentId } = await params

  const student = await db.student.findFirst({
    where: {
      id: studentId,
      ...(scope.isSuperAdmin ? {} : { schoolId: scope.schoolId! }),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      userId: true,
    },
  })

  if (!student) {
    return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
  }

  if (student.userId) {
    return NextResponse.json({ error: 'Este alumno ya tiene una cuenta de acceso' }, { status: 409 })
  }

  if (!student.email) {
    return NextResponse.json({ error: 'El alumno no tiene un correo de contacto para enviar la invitación' }, { status: 400 })
  }

  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS)

  await db.$transaction(async (transaction) => {
    await transaction.studentInvitationToken.deleteMany({
      where: { studentId: student.id, usedAt: null },
    })

    await transaction.studentInvitationToken.create({
      data: {
        token: tokenHash,
        studentId: student.id,
        email: student.email!,
        expiresAt,
      },
    })
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTDOJO_APP ?? 'http://localhost:3000'
  const invitationUrl = `${baseUrl}/registro/invitacion?token=${rawToken}`
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
      to: [student.email],
      subject: 'Te invitan a crear tu cuenta de Tosei Gusoku',
      html: `<p>Hola ${student.firstName} ${student.lastName},</p><p>Tu expediente quedó listo en Tosei Gusoku. Crea tu cuenta de acceso para consultar tu progreso en el dojo.</p><p><a href="${invitationUrl}">Crear mi cuenta</a></p><p>Este enlace vence en 7 días.</p>`,
    })

    if (emailResult.error) {
      console.error('Error enviando invitación:', emailResult.error)
      await db.studentInvitationToken.deleteMany({ where: { studentId: student.id, usedAt: null } })
      return NextResponse.json(
        { error: 'No se pudo enviar el correo de invitación. Inténtalo nuevamente.' },
        { status: 502 },
      )
    }
  }

  return NextResponse.json({
    ok: true,
    message: hasEmailConfig
      ? 'Invitación enviada al correo del alumno.'
      : 'Invitación generada. Enlázala manualmente (modo desarrollo).',
    ...(process.env.NODE_ENV !== 'production' ? { invitationUrl } : { invitationUrl: null }),
  })
}