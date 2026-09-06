import { auth } from '@/auth'
import { AdminEnrollments } from '@/components/dashboard/admin/AdminEnrollments'
import { getAdminEnrollments } from '@/lib/dashboard/admin-queries'
import { redirect } from 'next/navigation'

export default async function AdminEnrollmentsPage() {
    const session = await auth()
    const role = session?.user?.role
    const userId = session?.user?.id

    if ((role !== 'SCHOOL_ADMIN' && role !== 'SUPERADMIN') || !userId) {
        redirect('/dashboard/no-autorizado')
    }

    const enrollments = await getAdminEnrollments(userId)

    if (!enrollments) {
        redirect('/dashboard/no-autorizado')
    }

    return <AdminEnrollments enrollments={enrollments} />
}