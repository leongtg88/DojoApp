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
  repetitionsCount: z.number().int().min(0).optional().nullable(),
  stance: z.string().trim().max(100).optional().nullable(),
  level: z.string().trim().max(50).optional().nullable(),
  kumiteType: z.string().trim().max(100).optional().nullable(),
  distance: z.string().trim().max(50).optional().nullable(),
  role: z.string().trim().max(50).optional().nullable(),
  applicationType: z.string().trim().max(100).optional().nullable(),
  originKataId: z.string().trim().min(1).optional().nullable(),
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
      ...(rankId ? { beltRankKatas: { some: { beltRankId: rankId } } } : {}),
    },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
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

  if (result.data.originKataId) {
    const originKata = await db.technique.findFirst({
      where: {
        id: result.data.originKataId,
        category: 'KATA',
        ...(scope.isSuperAdmin ? {} : { OR: [{ schoolId: scope.schoolId }, { schoolId: null }] }),
      },
      select: { id: true },
    })

    if (!originKata) {
      return NextResponse.json({ error: 'La kata de origen no es válida' }, { status: 400 })
    }
  }

  const aggregate = await db.technique.aggregate({ _max: { order: true } })
  const order = result.data.order ?? (aggregate._max.order ?? 0) + 1

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
      repetitionsCount: result.data.repetitionsCount ?? null,
      stance: result.data.stance ?? null,
      level: result.data.level ?? null,
      kumiteType: result.data.kumiteType ?? null,
      distance: result.data.distance ?? null,
      role: result.data.role ?? null,
      applicationType: result.data.applicationType ?? null,
      originKataId: result.data.originKataId ?? null,
      schoolId: scope.schoolId ?? null,
    },
  })

  return NextResponse.json({ technique }, { status: 201 })
}