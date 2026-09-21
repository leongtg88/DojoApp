import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { hasAnyRole } from '@/lib/auth/roles'
import { listNotifications, markAllNotificationsRead } from '@/lib/notifications/queries'
import type { DashboardRole } from '@/types/dashboard'

const ALL_ROLES: DashboardRole[] = ['STUDENT', 'INSTRUCTOR', 'SCHOOL_ADMIN', 'SUPERADMIN']

const listQuerySchema = z.object({
  cursor: z.string().trim().min(1).max(64).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export async function GET(request: Request) {
  const session = await auth()

  if (!session?.user?.id || !hasAnyRole(session.user, ALL_ROLES)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const url = new URL(request.url)
  const query = listQuerySchema.safeParse({
    cursor: url.searchParams.get('cursor') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  })
  const { cursor, limit } = query.success ? query.data : { cursor: undefined, limit: 20 }

  const page = await listNotifications(session.user.id, limit, cursor)

  return NextResponse.json(page)
}

export async function PATCH() {
  const session = await auth()

  if (!session?.user?.id || !hasAnyRole(session.user, ALL_ROLES)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const updated = await markAllNotificationsRead(session.user.id)

  return NextResponse.json({ ok: true, updated })
}
