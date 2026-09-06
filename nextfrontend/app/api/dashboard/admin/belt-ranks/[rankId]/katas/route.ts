import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const assignKatasSchema = z.object({
  techniqueIds: z.array(z.string().trim().min(1)).max(500),
})

interface RankKatasContext {
  params: Promise<{ rankId: string }>
}

export async function PUT(request: Request, { params }: RankKatasContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const result = assignKatasSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: 'Lista de técnicas no válida' }, { status: 400 })
  }

  const { rankId } = await params
  const rank = await db.beltRank.findFirst({ where: { id: rankId } })

  if (!rank || (!scope.isSuperAdmin && rank.schoolId !== scope.schoolId)) {
    return NextResponse.json({ error: 'Grado no encontrado' }, { status: 404 })
  }

  const techniqueIds = [...new Set(result.data.techniqueIds)]
  const validCount = await db.technique.count({ where: { id: { in: techniqueIds } } })

  if (validCount !== techniqueIds.length) {
    return NextResponse.json({ error: 'Alguna técnica no existe' }, { status: 400 })
  }

  await db.$transaction([
    db.technique.updateMany({
      where: { rankId: rank.id, id: { notIn: techniqueIds } },
      data: { rankId: null },
    }),
    ...techniqueIds.map((techniqueId, position) =>
      db.technique.update({
        where: { id: techniqueId },
        data: { rankId: rank.id, order: rank.order * 1000 + position + 1 },
      }),
    ),
  ])

  return NextResponse.json({ ok: true })
}