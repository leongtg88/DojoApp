import { Prisma } from '@/lib/generated/prisma'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { hasAnyRole, hasRole } from '@/lib/auth/roles'
import { ageFromDob, programForAge } from '@/lib/dashboard/program'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const conversionSchema = z.object({
  applicantId: z.string().trim().min(1).optional(),
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

  if (!session?.user?.id || !hasAnyRole(session.user, ['SCHOOL_ADMIN', 'SUPERADMIN'])) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = conversionSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos del alumno no válidos' }, { status: 400 })
  }

  const admin = await db.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true, schoolId: true },
  })

  if (!admin || !hasAnyRole(admin, ['SCHOOL_ADMIN', 'SUPERADMIN'])) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (hasRole(admin, 'SCHOOL_ADMIN') && !hasRole(admin, 'SUPERADMIN') && !admin.schoolId) {
    return NextResponse.json({ error: 'Tu usuario no tiene una escuela asignada' }, { status: 403 })
  }

  const { enrollmentId } = await params
  const enrollment = await db.enrollment.findFirst({
    where: {
      id: enrollmentId,
      status: 'PENDING',
      ...(hasRole(admin, 'SUPERADMIN') ? {} : { schoolId: admin.schoolId! }),
    },
    select: {
      id: true,
      schoolId: true,
      branchId: true,
      contactEmail: true,
      contactPhone: true,
    registrationData: true,
    applicants: { select: { id: true, studentId: true, profileData: true } },
    },
  })

  if (!enrollment?.schoolId || !enrollment.branchId) {
    return NextResponse.json({ error: 'La inscripción no tiene escuela y sede asignadas' }, { status: 409 })
  }

  const input = result.data
  const applicant = input.applicantId ? enrollment.applicants.find(({ id, studentId }) => id === input.applicantId && !studentId) : null
  if (input.applicantId && !applicant) {
    return NextResponse.json({ error: 'El aspirante no está disponible para conversión' }, { status: 409 })
  }
  const student = await db.$transaction(async (transaction) => {
    const dateOfBirth = new Date(`${input.dateOfBirth}T00:00:00.000Z`)

    // Nuevo estudiante entra como cinturón blanco según su programa (edad).
    const defaultRank = await transaction.beltRank.findFirst({
      where: {
        program: programForAge(ageFromDob(dateOfBirth)),
        order: 1,
        OR: [{ schoolId: enrollment.schoolId! }, { schoolId: null }],
      },
      select: { id: true, name: true },
    })

    const createdStudent = await transaction.student.create({
      data: {
        schoolId: enrollment.schoolId!,
        branchId: enrollment.branchId!,
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth,
        email: enrollment.contactEmail,
        contactPhone: input.contactPhone ?? enrollment.contactPhone,
        medicalInfo: input.medicalInfo,
        emergencyContact: input.emergencyContact,
        currentRank: defaultRank?.name ?? null,
        registrationData: (applicant?.profileData ?? enrollment.registrationData) ?? Prisma.JsonNull,
      },
      select: { id: true },
    })

    if (defaultRank) {
      await transaction.studentRankHistory.create({
        data: {
          studentId: createdStudent.id,
          beltRankId: defaultRank.id,
          promotedBy: session.user.id,
        },
      })
    }

  if (applicant) {
    await transaction.enrollmentApplicant.update({ where: { id: applicant.id }, data: { studentId: createdStudent.id } })
    await transaction.studentDocument.updateMany({ where: { enrollmentId: enrollment.id, applicantId: applicant.id }, data: { studentId: createdStudent.id } })
    const remainingApplicants = await transaction.enrollmentApplicant.count({ where: { enrollmentId: enrollment.id, studentId: null } })
    await transaction.enrollment.update({ where: { id: enrollment.id }, data: remainingApplicants === 0 ? { status: 'ENROLLED', studentId: createdStudent.id } : {} })
  } else {
    await transaction.enrollment.update({ where: { id: enrollment.id }, data: { status: 'ENROLLED', studentId: createdStudent.id } })
  }

    return createdStudent
  })

  return NextResponse.json({ ok: true, studentId: student.id })
}