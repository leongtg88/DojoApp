import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const promotionSchema = z.object({
  beltRankId: z.string().trim().min(1),
  promotedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  examinerName: z.string().trim().max(120).nullable().optional(),
  notes: z.string().trim().max(1_000).nullable(),
}).refine(({ promotedAt }) => !Number.isNaN(new Date(`${promotedAt}T00:00:00.000Z`).getTime()), {
  message: 'Fecha de ascenso inválida',
  path: ['promotedAt'],
})

interface PromotionRouteContext {
  params: Promise<{ studentId: string }>
}

export async function POST(request: Request, { params }: PromotionRouteContext) {
  const session = await auth()

  if (!session?.user?.id || (session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPERADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = promotionSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de ascenso no válidos' }, { status: 400 })
  }

  const admin = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, schoolId: true },
  })

  if (!admin || (admin.role !== 'SCHOOL_ADMIN' && admin.role !== 'SUPERADMIN') || (admin.role === 'SCHOOL_ADMIN' && !admin.schoolId)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { studentId } = await params
  const student = await db.student.findFirst({
    where: {
      id: studentId,
      ...(admin.role === 'SUPERADMIN' ? {} : { schoolId: admin.schoolId! }),
    },
    select: { id: true, schoolId: true, currentRank: true },
  })

  if (!student) {
    return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
  }

  const newRank = await db.beltRank.findFirst({
    where: {
      id: result.data.beltRankId,
      OR: [{ schoolId: student.schoolId }, { schoolId: null }],
    },
    select: { id: true, name: true, order: true, techniques: { select: { id: true } } },
  })

  if (!newRank) {
    return NextResponse.json({ error: 'Grado no disponible para este alumno' }, { status: 400 })
  }

  const currentRank = student.currentRank
    ? await db.beltRank.findFirst({
        where: {
          name: student.currentRank,
          OR: [{ schoolId: student.schoolId }, { schoolId: null }],
        },
        select: { order: true },
      })
    : null

  if (currentRank && newRank.order <= currentRank.order) {
    return NextResponse.json({ error: 'El nuevo grado debe ser superior al grado actual' }, { status: 409 })
  }

  const promotedAt = new Date(`${result.data.promotedAt}T00:00:00.000Z`)
  const techniqueIds = newRank.techniques.map(({ id }) => id)

  await db.$transaction([
    db.student.update({
      where: { id: student.id },
      data: { currentRank: newRank.name },
    }),
    db.studentRankHistory.create({
      data: {
        studentId: student.id,
        beltRankId: newRank.id,
        promotedBy: session.user.id,
        promotedAt,
        examinerName: result.data.examinerName ?? null,
        notes: result.data.notes,
      },
    }),
    ...(techniqueIds.length > 0
      ? [
          db.studentTechnique.createMany({
            data: techniqueIds.map((techniqueId) => ({ studentId: student.id, techniqueId })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ])

  return NextResponse.json({ ok: true })
}