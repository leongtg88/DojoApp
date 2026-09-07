import { auth } from '@/auth'
import { AdminAttendanceReport } from '@/components/dashboard/admin/AdminAttendanceReport'
import { getAdminAttendance } from '@/lib/dashboard/admin-queries'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

export default async function AdminAttendancePage() {
    const session = await auth()
    const userId = session?.user?.id

    if (!hasAnyRole(session?.user, ['SCHOOL_ADMIN', 'SUPERADMIN']) || !userId) {
        redirect('/no-autorizado')
    }

    const records = await getAdminAttendance(userId)

    if (!records) {
        redirect('/no-autorizado')
    }

    return <AdminAttendanceReport records={records} />
}