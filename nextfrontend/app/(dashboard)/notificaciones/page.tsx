import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { listNotifications } from '@/lib/notifications/queries'
import { NotificationsCenter } from '@/components/dashboard/shared/NotificationsCenter'

export default async function NotificationsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const page = await listNotifications(session.user.id, 20)

  return <NotificationsCenter initialItems={page.items} initialNextCursor={page.nextCursor} />
}
