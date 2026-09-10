import { auth } from '@/auth'
import { AdminEnrollments } from '@/components/dashboard/admin/AdminEnrollments'
import { getAdminEnrollments } from '@/lib/dashboard/admin-queries'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'
import type { AdminEnrollmentSummary } from '@/types/dashboard'

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

    const formatter = new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Santo_Domingo' })
    const viewEnrollments: AdminEnrollmentSummary[] = enrollments.map((enrollment) => ({
        ...enrollment,
        createdAtLabel: formatter.format(new Date(enrollment.createdAt)),
    }))

    return <AdminEnrollments enrollments={viewEnrollments} />
}