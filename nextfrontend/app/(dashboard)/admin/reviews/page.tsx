import { auth } from '@/auth'
import { AdminReviews } from '@/components/dashboard/admin/AdminReviews'
import { getAdminReviews } from '@/lib/dashboard/admin-queries'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

export default async function AdminReviewsPage() {
    const session = await auth()
    const userId = session?.user?.id

    if (!hasAnyRole(session?.user, ['SCHOOL_ADMIN', 'SUPERADMIN']) || !userId) {
        redirect('/no-autorizado')
    }

    const reviews = await getAdminReviews(userId)

    if (!reviews) {
        redirect('/no-autorizado')
    }

    return <AdminReviews reviews={reviews} />
}
