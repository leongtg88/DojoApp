import { auth } from '@/auth'
import { AdminStudents } from '@/components/dashboard/admin/AdminStudents'
import { getAdminStudents } from '@/lib/dashboard/admin-queries'
import { redirect } from 'next/navigation'

export default async function AdminStudentsPage() {
    const session = await auth()
    const role = session?.user?.role
    const userId = session?.user?.id

    if ((role !== 'SCHOOL_ADMIN' && role !== 'SUPERADMIN') || !userId) {
        redirect('/dashboard/no-autorizado')
    }

    const students = await getAdminStudents(userId)

    if (!students) {
        redirect('/dashboard/no-autorizado')
    }

    return <AdminStudents students={students} />
}