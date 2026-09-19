import { auth } from '@/auth'
import { AdminCalendar } from '@/components/dashboard/admin/AdminCalendar'
import { getAdminCalendar } from '@/lib/dashboard/calendar-queries'
import { getAdminScope } from '@/lib/dashboard/scope'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

export default async function AdminCalendarPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!hasAnyRole(session?.user, ['SCHOOL_ADMIN', 'SUPERADMIN']) || !userId) {
    redirect('/no-autorizado')
  }

  const scope = await getAdminScope(userId)

  if (!scope) {
    redirect('/no-autorizado')
  }

  const calendar = await getAdminCalendar(scope.isSuperAdmin ? null : scope.schoolId)

  return <AdminCalendar convocations={calendar.convocations} holidays={calendar.holidays} />
}
