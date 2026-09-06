import { auth } from '@/auth'
import { AdminAttendanceReport } from '@/components/dashboard/admin/AdminAttendanceReport'
import { getAdminAttendance } from '@/lib/dashboard/admin-queries'
import { redirect } from 'next/navigation'

export default async function AdminAttendancePage() {
    const session = await auth()
    const role = session?.user?.role
    const userId = session?.user?.id

    if ((role !== 'SCHOOL_ADMIN' && role !== 'SUPERADMIN') || !userId) {
        redirect('/dashboard/no-autorizado')
    }

    const records = await getAdminAttendance(userId)

    if (!records) {
        redirect('/dashboard/no-autorizado')
    }

    return <AdminAttendanceReport records={records} />
}