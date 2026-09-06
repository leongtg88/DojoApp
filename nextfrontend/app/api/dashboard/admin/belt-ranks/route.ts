import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminBeltRanks } from '@/lib/dashboard/admin-queries'
import { getAdminScope } from '@/lib/dashboard/scope'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createRankSchema = z.object({
  name: z.string().trim().min(1).max(50),
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

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const ranks = await getAdminBeltRanks(session.user.id)

  if (!ranks) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  return NextResponse.json({ ranks })
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

  const body = await request.json().catch(() => null)
  const result = createRankSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de grado no válidos' }, { status: 400 })
  }

  if (!result.data.name) {
    return NextResponse.json({ error: 'El nombre del grado es obligatorio' }, { status: 400 })
  }

  const existing = await db.beltRank.findFirst({ where: { name: result.data.name } })

  if (existing) {
    return NextResponse.json({ error: 'Ya existe un grado con ese nombre' }, { status: 409 })
  }

  const aggregate = await db.beltRank.aggregate({ _max: { order: true } })
  const order = result.data.order ?? (aggregate._max.order ?? -1) + 1

  const rank = await db.beltRank.create({
    data: {
      name: result.data.name,
      kyuDan: result.data.kyuDan ?? null,
      japaneseName: result.data.japaneseName ?? null,
      kanji: result.data.kanji ?? null,
      order,
      beltColor: result.data.beltColor ?? null,
      beltSecondaryColor: result.data.beltSecondaryColor ?? null,
      isMaximumRank: result.data.isMaximumRank ?? false,
      estimatedDurationMonths: result.data.estimatedDurationMonths ?? null,
      description: result.data.description ?? null,
      minMonths: result.data.minMonths ?? null,
      minAttendancePercent: result.data.minAttendancePercent ?? null,
      schoolId: scope.schoolId ?? null,
    },
  })

  return NextResponse.json({ rank }, { status: 201 })
}