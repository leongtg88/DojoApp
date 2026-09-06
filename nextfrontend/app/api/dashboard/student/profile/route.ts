import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const profileUpdateSchema = z.object({
  contactPhone: z.string().trim().max(30).nullable(),
  emergencyContact: z.string().trim().max(500).nullable(),
  medicalInfo: z.string().trim().max(2_000).nullable(),
})

export async function PATCH(request: Request) {
  const session = await auth()

  if (session?.user?.role !== 'STUDENT' || !session.user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const result = profileUpdateSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de perfil no válidos' }, { status: 400 })
  }

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!student) {
    return NextResponse.json({ error: 'Perfil de estudiante no encontrado' }, { status: 404 })
  }

  const profile = await db.student.update({
    where: { id: student.id },
    data: result.data,
    select: {
      contactPhone: true,
      emergencyContact: true,
      medicalInfo: true,
    },
  })

  return NextResponse.json({ profile })
}