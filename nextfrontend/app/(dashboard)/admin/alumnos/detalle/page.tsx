import { auth } from '@/auth'
import { AdminStudentDetailExplorer } from '@/components/dashboard/admin/AdminStudentDetailExplorer'
import { getAdminStudentDetail, getAdminStudents } from '@/lib/dashboard/admin-queries'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

interface AdminStudentDetailExplorerPageProps {
    searchParams: Promise<{ studentId?: string }>
}

export default async function AdminStudentDetailExplorerPage({ searchParams }: AdminStudentDetailExplorerPageProps) {
    const session = await auth()
    const userId = session?.user?.id

    if (!hasAnyRole(session?.user, ['SCHOOL_ADMIN', 'SUPERADMIN']) || !userId) {
        redirect('/no-autorizado')
    }

    const { studentId } = await searchParams
    const students = await getAdminStudents(userId)

    if (!students) {
        redirect('/no-autorizado')
    }

    const detail = studentId ? await getAdminStudentDetail(userId, studentId) : null

    return <AdminStudentDetailExplorer students={students} detail={detail} selectedId={studentId ?? null} />
}
