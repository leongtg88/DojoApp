import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createConvocationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  examDay: z.enum(['SATURDAY', 'SUNDAY']),
  label: z.string().trim().max(80).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  confirmed: z.boolean().default(false),
})

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const convocations = await db.examConvocation.findMany({
    where: scope.isSuperAdmin ? {} : { schoolId: scope.schoolId! },
    orderBy: { date: 'asc' },
    select: { id: true, date: true, examDay: true, label: true, notes: true, confirmed: true },
  })

  return NextResponse.json({
    convocations: convocations.map((convocation) => ({ ...convocation, date: convocation.date.toISOString() })),
  })
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope || !scope.schoolId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = createConvocationSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de la convocatoria no válidos' }, { status: 400 })
  }

  const date = new Date(`${result.data.date}T00:00:00`)

  const convocation = await db.examConvocation.upsert({
    where: { schoolId_date_examDay: { schoolId: scope.schoolId, date, examDay: result.data.examDay } },
    update: { label: result.data.label ?? null, notes: result.data.notes ?? null, confirmed: result.data.confirmed },
    create: {
      schoolId: scope.schoolId,
      date,
      examDay: result.data.examDay,
      label: result.data.label ?? null,
      notes: result.data.notes ?? null,
      confirmed: result.data.confirmed,
    },
  })

  return NextResponse.json({ convocation: { ...convocation, date: convocation.date.toISOString() } }, { status: 201 })
}
