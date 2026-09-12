import { auth } from '@/auth'
import { AdminBalance } from '@/components/dashboard/admin/AdminBalance'
import { getAdminBalanceReport } from '@/lib/dashboard/admin-queries'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

export default async function AdminBalancePage() {
    const session = await auth()
    const userId = session?.user?.id

    if (!hasAnyRole(session?.user, ['SCHOOL_ADMIN', 'SUPERADMIN']) || !userId) {
        redirect('/no-autorizado')
    }

    const rows = await getAdminBalanceReport(userId)

    if (!rows) {
        redirect('/no-autorizado')
    }

    return <AdminBalance rows={rows} />
}