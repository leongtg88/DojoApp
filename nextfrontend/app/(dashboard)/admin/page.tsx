import { auth } from '@/auth'
import { AdminDashboardOverview } from '@/components/dashboard/admin/AdminDashboardOverview'
import { getAdminDashboardSummary, getAdminUpcomingBirthdays } from '@/lib/dashboard/admin-queries'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

export default async function AdminDashboardPage() {
    const session = await auth()
    const userId = session?.user?.id

    if (!hasAnyRole(session?.user, ['SCHOOL_ADMIN', 'SUPERADMIN']) || !userId) {
        redirect('/no-autorizado')
    }

    const [summary, birthdays] = await Promise.all([
        getAdminDashboardSummary(userId),
        getAdminUpcomingBirthdays(userId),
    ])

    if (!summary || !birthdays) {
        redirect('/no-autorizado')
    }

    return <AdminDashboardOverview birthdays={birthdays} summary={summary} />
}