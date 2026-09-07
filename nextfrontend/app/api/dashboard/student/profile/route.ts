import { auth } from '@/auth'
import { db } from '@/lib/db'
import { hasRole } from '@/lib/auth/roles'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(2).max(80).optional(),
  lastName: z.string().trim().min(2).max(120).optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido')
    .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()), { message: 'Fecha de nacimiento inválida' })
    .optional(),
  contactPhone: z.string().trim().max(30).nullable(),
  emergencyContact: z.string().trim().max(500).nullable(),
  medicalInfo: z.string().trim().max(2_000).nullable(),
}).refine(({ dateOfBirth }) => {
  if (!dateOfBirth) return true
  return new Date(`${dateOfBirth}T00:00:00.000Z`).getTime() <= Date.now()
}, {
  message: 'La fecha de nacimiento no puede ser futura',
  path: ['dateOfBirth'],
})

export async function PATCH(request: Request) {
  const session = await auth()

  if (!session?.user?.id || !hasRole(session?.user, 'STUDENT')) {
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
    data: {
      ...(result.data.firstName !== undefined ? { firstName: result.data.firstName } : {}),
      ...(result.data.lastName !== undefined ? { lastName: result.data.lastName } : {}),
      ...(result.data.dateOfBirth !== undefined ? { dateOfBirth: new Date(`${result.data.dateOfBirth}T00:00:00.000Z`) } : {}),
      contactPhone: result.data.contactPhone,
      emergencyContact: result.data.emergencyContact,
      medicalInfo: result.data.medicalInfo,
    },
    select: {
      firstName: true,
      lastName: true,
      contactPhone: true,
      emergencyContact: true,
      medicalInfo: true,
    },
  })

  return NextResponse.json({ profile })
}