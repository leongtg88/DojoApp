import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateTechniqueSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  japaneseName: z.string().trim().max(100).optional().nullable(),
  kanji: z.string().trim().max(20).optional().nullable(),
  description: z.string().trim().max(2_000).optional().nullable(),
  category: z.enum(['KIHON', 'KATA', 'KUMITE', 'BUNKAI']).optional(),
  order: z.number().int().min(0).optional(),
  movementsCount: z.number().int().min(0).optional().nullable(),
  embusen: z.string().trim().max(50).optional().nullable(),
  difficulty: z.string().trim().max(50).optional().nullable(),
  videoUrl: z.url().optional().nullable(),
  rankId: z.string().trim().min(1).optional().nullable(),
})

interface TechniqueRouteContext {
  params: Promise<{ techniqueId: string }>
}

export async function PATCH(request: Request, { params }: TechniqueRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const result = updateTechniqueSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de técnica no válidos' }, { status: 400 })
  }

  const { techniqueId } = await params
  const technique = await db.technique.findFirst({ where: { id: techniqueId } })

  if (!technique || (!scope.isSuperAdmin && technique.schoolId !== scope.schoolId)) {
    return NextResponse.json({ error: 'Técnica no encontrada' }, { status: 404 })
  }

  if (result.data.rankId) {
    const rank = await db.beltRank.findFirst({ where: { id: result.data.rankId } })

    if (!rank || (!scope.isSuperAdmin && rank.schoolId !== scope.schoolId)) {
      return NextResponse.json({ error: 'Grado no encontrado' }, { status: 404 })
    }
  }

  const data = Object.fromEntries(
    Object.entries(result.data).filter(([, value]) => value !== undefined),
  )

  const updated = await db.technique.update({ where: { id: technique.id }, data })

  return NextResponse.json({ technique: updated })
}

export async function DELETE(_request: Request, { params }: TechniqueRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { techniqueId } = await params
  const technique = await db.technique.findFirst({
    where: { id: techniqueId },
    include: {
      _count: { select: { students: true } },
    },
  })

  if (!technique || (!scope.isSuperAdmin && technique.schoolId !== scope.schoolId)) {
    return NextResponse.json({ error: 'Técnica no encontrada' }, { status: 404 })
  }

  if (technique._count.students > 0) {
    return NextResponse.json({ error: 'Hay alumnos trabajando esta técnica y no se puede eliminar' }, { status: 409 })
  }

  await db.technique.delete({ where: { id: technique.id } })

  return NextResponse.json({ ok: true })
}