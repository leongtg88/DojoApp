import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const reorderSchema = z.object({
  program: z.enum(['ADULT', 'YOUTH']),
  rankIds: z.array(z.string().trim().min(1)).min(1).max(200),
})

export async function PUT(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const result = reorderSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de reordenamiento no válidos' }, { status: 400 })
  }

  const { program, rankIds } = result.data

  if (new Set(rankIds).size !== rankIds.length) {
    return NextResponse.json({ error: 'La lista de grados contiene duplicados' }, { status: 400 })
  }

  const ranks = await db.beltRank.findMany({
    where: { id: { in: rankIds } },
    select: { id: true, program: true, schoolId: true },
  })

  if (ranks.length !== rankIds.length) {
    return NextResponse.json({ error: 'Alguno de los grados no existe' }, { status: 404 })
  }

  for (const rank of ranks) {
    if (rank.program !== program) {
      return NextResponse.json({ error: 'Los grados deben pertenecer al mismo programa' }, { status: 400 })
    }
    if (!scope.isSuperAdmin && rank.schoolId !== scope.schoolId) {
      return NextResponse.json({ error: 'No autorizado para reordenar este grado' }, { status: 403 })
    }
  }

  try {
    await db.$transaction(async (tx) => {
      // Fase 1: aparcar en un rango negativo único para no chocar con los
      // índices únicos (program, order) y (schoolId, program, order).
      for (let index = 0; index < rankIds.length; index += 1) {
        await tx.beltRank.update({ where: { id: rankIds[index] }, data: { order: -100000 - (index + 1) } })
      }
      // Fase 2: asignar el orden final 1..n.
      for (let index = 0; index < rankIds.length; index += 1) {
        await tx.beltRank.update({ where: { id: rankIds[index] }, data: { order: index + 1 } })
      }
    })
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'No fue posible reordenar los grados por un conflicto de orden' }, { status: 409 })
    }
    throw error
  }

  return NextResponse.json({ ok: true })
}
