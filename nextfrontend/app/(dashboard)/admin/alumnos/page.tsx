import { auth } from '@/auth'
import { AdminStudents } from '@/components/dashboard/admin/AdminStudents'
import { getAdminStudents } from '@/lib/dashboard/admin-queries'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

export default async function AdminStudentsPage() {
    const session = await auth()
    const userId = session?.user?.id

    if (!hasAnyRole(session?.user, ['SCHOOL_ADMIN', 'SUPERADMIN']) || !userId) {
        redirect('/no-autorizado')
    }

    const students = await getAdminStudents(userId)

    if (!students) {
        redirect('/no-autorizado')
    }

    return <AdminStudents students={students} />
}