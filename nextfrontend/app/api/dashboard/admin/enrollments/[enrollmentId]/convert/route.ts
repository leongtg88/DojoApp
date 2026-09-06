import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const conversionSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(120),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  contactPhone: z.string().trim().max(30).nullable(),
  medicalInfo: z.string().trim().max(2_000).nullable(),
  emergencyContact: z.string().trim().max(500).nullable(),
}).refine(({ dateOfBirth }) => !Number.isNaN(new Date(`${dateOfBirth}T00:00:00.000Z`).getTime()), {
  message: 'Fecha de nacimiento inválida',
  path: ['dateOfBirth'],
})

interface ConvertEnrollmentRouteContext {
  params: Promise<{ enrollmentId: string }>
}

export async function POST(request: Request, { params }: ConvertEnrollmentRouteContext) {
  const session = await auth()

  if (!session?.user?.id || (session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPERADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = conversionSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos del alumno no válidos' }, { status: 400 })
  }

  const admin = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, schoolId: true },
  })

  if (!admin || (admin.role !== 'SCHOOL_ADMIN' && admin.role !== 'SUPERADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (admin.role === 'SCHOOL_ADMIN' && !admin.schoolId) {
    return NextResponse.json({ error: 'Tu usuario no tiene una escuela asignada' }, { status: 403 })
  }

  const { enrollmentId } = await params
  const enrollment = await db.enrollment.findFirst({
    where: {
      id: enrollmentId,
      status: 'PENDING',
      ...(admin.role === 'SUPERADMIN' ? {} : { schoolId: admin.schoolId! }),
    },
    select: {
      id: true,
      schoolId: true,
      branchId: true,
      contactPhone: true,
    },
  })

  if (!enrollment?.schoolId || !enrollment.branchId) {
    return NextResponse.json({ error: 'La inscripción no tiene escuela y sede asignadas' }, { status: 409 })
  }

  const input = result.data
  const student = await db.$transaction(async (transaction) => {
    const createdStudent = await transaction.student.create({
      data: {
        schoolId: enrollment.schoolId!,
        branchId: enrollment.branchId!,
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: new Date(`${input.dateOfBirth}T00:00:00.000Z`),
        contactPhone: input.contactPhone ?? enrollment.contactPhone,
        medicalInfo: input.medicalInfo,
        emergencyContact: input.emergencyContact,
      },
      select: { id: true },
    })

    await transaction.enrollment.update({
      where: { id: enrollment.id },
      data: { status: 'ENROLLED', studentId: createdStudent.id },
    })

    return createdStudent
  })

  return NextResponse.json({ ok: true, studentId: student.id })
}