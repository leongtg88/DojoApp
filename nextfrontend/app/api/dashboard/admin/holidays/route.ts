import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createHolidaySchema = z.object({
  name: z.string().trim().min(1).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  recurring: z.boolean().default(false),
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

  const holidays = await db.holiday.findMany({
    where: scope.isSuperAdmin ? {} : { OR: [{ schoolId: scope.schoolId }, { schoolId: null }] },
    orderBy: { date: 'asc' },
    select: { id: true, name: true, date: true, recurring: true, schoolId: true },
  })

  return NextResponse.json({
    holidays: holidays.map((holiday) => ({ ...holiday, date: holiday.date.toISOString() })),
  })
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

  const result = createHolidaySchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos del feriado no válidos' }, { status: 400 })
  }

  const date = new Date(`${result.data.date}T00:00:00`)

  const existing = await db.holiday.findFirst({ where: { date, schoolId: scope.schoolId } })
  const holiday = existing
    ? await db.holiday.update({
        where: { id: existing.id },
        data: { name: result.data.name, recurring: result.data.recurring },
      })
    : await db.holiday.create({
        data: {
          name: result.data.name,
          date,
          recurring: result.data.recurring,
          schoolId: scope.schoolId,
        },
      })

  return NextResponse.json({ holiday: { ...holiday, date: holiday.date.toISOString() } }, { status: 201 })
}
