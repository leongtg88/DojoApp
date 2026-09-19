import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { NextResponse } from 'next/server'

interface HolidayRouteContext {
  params: Promise<{ holidayId: string }>
}

export async function DELETE(_request: Request, { params }: HolidayRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { holidayId } = await params
  const holiday = await db.holiday.findUnique({ where: { id: holidayId } })

  if (!holiday || (!scope.isSuperAdmin && holiday.schoolId !== scope.schoolId)) {
    return NextResponse.json({ error: 'Feriado no encontrado' }, { status: 404 })
  }

  await db.holiday.delete({ where: { id: holiday.id } })

  return NextResponse.json({ ok: true })
}
