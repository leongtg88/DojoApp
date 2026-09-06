import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createStudentSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(120),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  contactPhone: z.string().trim().max(30).nullable().optional(),
  medicalInfo: z.string().trim().max(2_000).nullable().optional(),
  emergencyContact: z.string().trim().max(500).nullable().optional(),
  branchId: z.string().trim().min(1),
  beltRankId: z.string().trim().min(1).nullable().optional(),
}).refine(({ dateOfBirth }) => !Number.isNaN(new Date(`${dateOfBirth}T00:00:00.000Z`).getTime()), {
  message: 'Fecha de nacimiento inválida',
  path: ['dateOfBirth'],
})

async function buildMemberNumber(schoolId: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `KYU-${year}-`
  const count = await db.student.count({ where: { memberNumber: { startsWith: prefix } } })
  let sequence = count + 1
  let memberNumber = `${prefix}${String(sequence).padStart(3, '0')}`
  while (await db.student.findUnique({ where: { memberNumber } })) {
    sequence += 1
    memberNumber = `${prefix}${String(sequence).padStart(3, '0')}`
  }
  return memberNumber
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = createStudentSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos del alumno no válidos' }, { status: 400 })
  }

  const { branchId, beltRankId, ...input } = result.data

  const branch = await db.branch.findUnique({
    where: { id: branchId },
    select: { id: true, schoolId: true },
  })

  if (!branch || (scope.schoolId !== null && branch.schoolId !== scope.schoolId)) {
    return NextResponse.json({ error: 'Sucursal no disponible para tu alcance' }, { status: 403 })
  }

  let rank: { id: string; name: string; techniqueIds: string[] } | null = null

  if (beltRankId) {
    const beltRank = await db.beltRank.findFirst({
      where: {
        id: beltRankId,
        ...(scope.isSuperAdmin ? {} : { OR: [{ schoolId: branch.schoolId }, { schoolId: null }] }),
      },
      select: { id: true, name: true, techniques: { select: { id: true } } },
    })

    if (!beltRank) {
      return NextResponse.json({ error: 'Grado inicial no disponible para esta escuela' }, { status: 400 })
    }

    rank = { id: beltRank.id, name: beltRank.name, techniqueIds: beltRank.techniques.map(({ id }) => id) }
  }

  const memberNumber = await buildMemberNumber(branch.schoolId)

  const student = await db.$transaction(async (transaction) => {
    const created = await transaction.student.create({
      data: {
        schoolId: branch.schoolId,
        branchId: branch.id,
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: new Date(`${input.dateOfBirth}T00:00:00.000Z`),
        contactPhone: input.contactPhone ?? null,
        medicalInfo: input.medicalInfo ?? null,
        emergencyContact: input.emergencyContact ?? null,
        memberNumber,
      },
      select: { id: true },
    })

    if (rank) {
      await transaction.studentRankHistory.create({
        data: {
          studentId: created.id,
          beltRankId: rank.id,
          promotedBy: session.user!.id,
        },
      })
      await transaction.student.update({
        where: { id: created.id },
        data: { currentRank: rank.name },
      })
      if (rank.techniqueIds.length > 0) {
        await transaction.studentTechnique.createMany({
          data: rank.techniqueIds.map((techniqueId) => ({ studentId: created.id, techniqueId })),
        })
      }
    }

    return created
  })

  return NextResponse.json({ ok: true, studentId: student.id, memberNumber }, { status: 201 })
}