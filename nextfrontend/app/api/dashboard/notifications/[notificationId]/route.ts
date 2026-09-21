import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { hasAnyRole } from '@/lib/auth/roles'
import { markNotificationRead } from '@/lib/notifications/queries'

interface NotificationRouteContext {
  params: Promise<{ notificationId: string }>
}

export async function PATCH(_: Request, { params }: NotificationRouteContext) {
  const session = await auth()

  if (!session?.user?.id || !hasAnyRole(session.user, ['STUDENT', 'INSTRUCTOR', 'SCHOOL_ADMIN', 'SUPERADMIN'])) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { notificationId } = await params
  const updated = await markNotificationRead(session.user.id, notificationId)

  if (!updated) {
    return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
