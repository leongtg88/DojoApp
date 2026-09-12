import { auth } from '@/auth'
import { AdminPlans } from '@/components/dashboard/admin/AdminPlans'
import { getAdminPlans } from '@/lib/dashboard/admin-queries'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

export default async function AdminPlansPage() {
    const session = await auth()
    const userId = session?.user?.id

    if (!hasAnyRole(session?.user, ['SCHOOL_ADMIN', 'SUPERADMIN']) || !userId) {
        redirect('/no-autorizado')
    }

    const plans = await getAdminPlans(userId)

    if (!plans) {
        redirect('/no-autorizado')
    }

    return <AdminPlans plans={plans} />
}