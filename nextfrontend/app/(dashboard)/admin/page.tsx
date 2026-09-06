import { auth } from '@/auth'
import { AdminDashboardOverview } from '@/components/dashboard/admin/AdminDashboardOverview'
import { getAdminDashboardSummary, getAdminUpcomingBirthdays } from '@/lib/dashboard/admin-queries'
import { redirect } from 'next/navigation'

export default async function AdminDashboardPage() {
    const session = await auth()
    const role = session?.user?.role
    const userId = session?.user?.id

    if ((role !== 'SCHOOL_ADMIN' && role !== 'SUPERADMIN') || !userId) {
        redirect('/dashboard/no-autorizado')
    }

    const [summary, birthdays] = await Promise.all([
        getAdminDashboardSummary(userId),
        getAdminUpcomingBirthdays(userId),
    ])

    if (!summary || !birthdays) {
        redirect('/dashboard/no-autorizado')
    }

    return <AdminDashboardOverview birthdays={birthdays} summary={summary} />
}