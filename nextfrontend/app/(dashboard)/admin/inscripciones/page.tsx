import { auth } from '@/auth'
import { AdminEnrollments } from '@/components/dashboard/admin/AdminEnrollments'
import { getAdminEnrollments } from '@/lib/dashboard/admin-queries'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

export default async function AdminEnrollmentsPage() {
    const session = await auth()
    const userId = session?.user?.id

    if (!hasAnyRole(session?.user, ['SCHOOL_ADMIN', 'SUPERADMIN']) || !userId) {
        redirect('/no-autorizado')
    }

    const enrollments = await getAdminEnrollments(userId)

    if (!enrollments) {
        redirect('/no-autorizado')
    }

    return <AdminEnrollments enrollments={enrollments} />
}