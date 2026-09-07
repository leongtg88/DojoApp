import { auth } from '@/auth'
import { AdminStudentDetail } from '@/components/dashboard/admin/AdminStudentDetail'
import { getAdminStudentDetail } from '@/lib/dashboard/admin-queries'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

interface AdminStudentDetailPageProps {
    params: Promise<{ studentId: string }>
}

export default async function AdminStudentDetailPage({ params }: AdminStudentDetailPageProps) {
    const session = await auth()
    const userId = session?.user?.id

    if (!hasAnyRole(session?.user, ['SCHOOL_ADMIN', 'SUPERADMIN']) || !userId) {
        redirect('/no-autorizado')
    }

    const { studentId } = await params
    const student = await getAdminStudentDetail(userId, studentId)

    if (!student) {
        redirect('/no-autorizado')
    }

    return <AdminStudentDetail student={student} />
}