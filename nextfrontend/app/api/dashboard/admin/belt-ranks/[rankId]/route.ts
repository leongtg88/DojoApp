import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateRankSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  kyuDan: z.string().trim().max(20).optional().nullable(),
  japaneseName: z.string().trim().max(50).optional().nullable(),
  kanji: z.string().trim().max(10).optional().nullable(),
  order: z.number().int().min(0).optional(),
  beltColor: z.string().trim().max(20).optional().nullable(),
  beltSecondaryColor: z.string().trim().max(20).optional().nullable(),
  isMaximumRank: z.boolean().optional(),
  estimatedDurationMonths: z.number().int().min(0).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  minMonths: z.number().int().min(0).optional().nullable(),
  minAttendancePercent: z.number().int().min(0).max(100).optional().nullable(),
})

interface RankRouteContext {
  params: Promise<{ rankId: string }>
}

export async function PUT(request: Request, { params }: RankRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const result = updateRankSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de grado no válidos' }, { status: 400 })
  }

  const { rankId } = await params
  const rank = await db.beltRank.findFirst({ where: { id: rankId } })

  if (!rank || (!scope.isSuperAdmin && rank.schoolId !== scope.schoolId)) {
    return NextResponse.json({ error: 'Grado no encontrado' }, { status: 404 })
  }

  const data = Object.fromEntries(
    Object.entries(result.data).filter(([, value]) => value !== undefined),
  )

  const updated = await db.beltRank.update({ where: { id: rank.id }, data })

  return NextResponse.json({ rank: updated })
}

export async function DELETE(_request: Request, { params }: RankRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { rankId } = await params
  const rank = await db.beltRank.findFirst({
    where: { id: rankId },
    include: {
      _count: { select: { techniques: true, promotions: true } },
    },
  })

  if (!rank || (!scope.isSuperAdmin && rank.schoolId !== scope.schoolId)) {
    return NextResponse.json({ error: 'Grado no encontrado' }, { status: 404 })
  }

  if (rank._count.techniques > 0 || rank._count.promotions > 0) {
    return NextResponse.json({ error: 'El grado tiene técnicas o promociones asociadas y no se puede eliminar' }, { status: 409 })
  }

  const assignedStudents = await db.student.count({ where: { currentRank: rank.name } })

  if (assignedStudents > 0) {
    return NextResponse.json({ error: 'Hay alumnos con este grado asignado y no se puede eliminar' }, { status: 409 })
  }

  await db.beltRank.delete({ where: { id: rank.id } })

  return NextResponse.json({ ok: true })
}