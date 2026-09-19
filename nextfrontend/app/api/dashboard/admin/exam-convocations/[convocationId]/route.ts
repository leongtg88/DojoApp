import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateConvocationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  examDay: z.enum(['SATURDAY', 'SUNDAY']).optional(),
  label: z.string().trim().max(80).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  confirmed: z.boolean().optional(),
})

interface ConvocationRouteContext {
  params: Promise<{ convocationId: string }>
}

export async function PUT(request: Request, { params }: ConvocationRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = updateConvocationSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de la convocatoria no válidos' }, { status: 400 })
  }

  const { convocationId } = await params
  const convocation = await db.examConvocation.findUnique({ where: { id: convocationId } })

  if (!convocation || (!scope.isSuperAdmin && convocation.schoolId !== scope.schoolId)) {
    return NextResponse.json({ error: 'Convocatoria no encontrada' }, { status: 404 })
  }

  const updated = await db.examConvocation.update({
    where: { id: convocation.id },
    data: {
      ...(result.data.date ? { date: new Date(`${result.data.date}T00:00:00`) } : {}),
      ...(result.data.examDay ? { examDay: result.data.examDay } : {}),
      ...(result.data.label !== undefined ? { label: result.data.label } : {}),
      ...(result.data.notes !== undefined ? { notes: result.data.notes } : {}),
      ...(result.data.confirmed !== undefined ? { confirmed: result.data.confirmed } : {}),
    },
  })

  return NextResponse.json({ convocation: { ...updated, date: updated.date.toISOString() } })
}

export async function DELETE(_request: Request, { params }: ConvocationRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { convocationId } = await params
  const convocation = await db.examConvocation.findUnique({ where: { id: convocationId } })

  if (!convocation || (!scope.isSuperAdmin && convocation.schoolId !== scope.schoolId)) {
    return NextResponse.json({ error: 'Convocatoria no encontrada' }, { status: 404 })
  }

  await db.examConvocation.delete({ where: { id: convocation.id } })

  return NextResponse.json({ ok: true })
}
