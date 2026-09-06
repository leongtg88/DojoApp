import { Prisma } from '@prisma/client'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope, scopeSchoolFilter } from '@/lib/dashboard/scope'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateStudentSchema = z.object({
  firstName: z.string().trim().min(2).max(80).optional(),
  lastName: z.string().trim().min(2).max(120).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  contactPhone: z.string().trim().max(30).nullable().optional(),
  medicalInfo: z.string().trim().max(2_000).nullable().optional(),
  emergencyContact: z.string().trim().max(500).nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED']).optional(),
}).refine(({ dateOfBirth }) => !dateOfBirth || !Number.isNaN(new Date(`${dateOfBirth}T00:00:00.000Z`).getTime()), {
  message: 'Fecha de nacimiento inválida',
  path: ['dateOfBirth'],
})

interface UpdateStudentRouteContext {
  params: Promise<{ studentId: string }>
}

export async function PATCH(request: Request, { params }: UpdateStudentRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = updateStudentSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos del alumno no válidos' }, { status: 400 })
  }

  const { studentId } = await params
  const existing = await db.student.findFirst({
    where: { id: studentId, ...scopeSchoolFilter(scope) },
    select: { id: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
  }

  const data: Prisma.StudentUpdateInput = {}

  if (result.data.firstName) data.firstName = result.data.firstName
  if (result.data.lastName) data.lastName = result.data.lastName
  if (result.data.dateOfBirth) data.dateOfBirth = new Date(`${result.data.dateOfBirth}T00:00:00.000Z`)
  if (result.data.contactPhone !== undefined) data.contactPhone = result.data.contactPhone
  if (result.data.medicalInfo !== undefined) data.medicalInfo = result.data.medicalInfo
  if (result.data.emergencyContact !== undefined) data.emergencyContact = result.data.emergencyContact
  if (result.data.status) data.status = result.data.status

  await db.student.update({
    where: { id: existing.id },
    data,
  })

  return NextResponse.json({ ok: true, studentId: existing.id })
}