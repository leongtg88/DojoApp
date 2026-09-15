import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { listNotifications, markAllNotificationsRead } from '@/lib/notifications/queries'

export async function GET(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const url = new URL(request.url)
  const cursor = url.searchParams.get('cursor')
  const requestedLimit = Number(url.searchParams.get('limit') ?? '20')
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 20

  const page = await listNotifications(session.user.id, limit, cursor)

  return NextResponse.json(page)
}

export async function PATCH() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const updated = await markAllNotificationsRead(session.user.id)

  return NextResponse.json({ ok: true, updated })
}
