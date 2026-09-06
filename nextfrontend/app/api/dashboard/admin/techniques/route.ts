import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createTechniqueSchema = z.object({
  name: z.string().trim().min(1).max(100),
  japaneseName: z.string().trim().max(100).optional().nullable(),
  kanji: z.string().trim().max(20).optional().nullable(),
  description: z.string().trim().max(2_000).optional().nullable(),
  category: z.enum(['KIHON', 'KATA', 'KUMITE', 'BUNKAI']).default('KATA'),
  order: z.number().int().min(0).optional(),
  movementsCount: z.number().int().min(0).optional().nullable(),
  embusen: z.string().trim().max(50).optional().nullable(),
  difficulty: z.string().trim().max(50).optional().nullable(),
  videoUrl: z.url().optional().nullable(),
  rankId: z.string().trim().min(1).optional().nullable(),
})

export async function GET(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const rankId = searchParams.get('rankId') ?? undefined

  const techniques = await db.technique.findMany({
    where: {
      OR: scope.isSuperAdmin ? undefined : [{ schoolId: scope.schoolId }, { schoolId: null }],
      ...(rankId ? { rankId } : {}),
    },
    orderBy: [{ rankId: 'asc' }, { order: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json({ techniques })
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
  const result = createTechniqueSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de técnica no válidos' }, { status: 400 })
  }

  const aggregate = await db.technique.aggregate({ _max: { order: true } })
  const order = result.data.order ?? (aggregate._max.order ?? 0) + 1

  if (result.data.rankId) {
    const rank = await db.beltRank.findFirst({ where: { id: result.data.rankId } })

    if (!rank || (!scope.isSuperAdmin && rank.schoolId !== scope.schoolId)) {
      return NextResponse.json({ error: 'Grado no encontrado' }, { status: 404 })
    }
  }

  const technique = await db.technique.create({
    data: {
      name: result.data.name,
      japaneseName: result.data.japaneseName ?? null,
      kanji: result.data.kanji ?? null,
      description: result.data.description ?? null,
      category: result.data.category,
      order,
      movementsCount: result.data.movementsCount ?? null,
      embusen: result.data.embusen ?? null,
      difficulty: result.data.difficulty ?? null,
      videoUrl: result.data.videoUrl ?? null,
      rankId: result.data.rankId ?? null,
      schoolId: scope.schoolId ?? null,
    },
  })

  return NextResponse.json({ technique }, { status: 201 })
}