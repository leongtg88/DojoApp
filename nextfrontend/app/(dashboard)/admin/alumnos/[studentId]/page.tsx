import { auth } from '@/auth'
import { AdminStudentDetail } from '@/components/dashboard/admin/AdminStudentDetail'
import { getAdminStudentDetail } from '@/lib/dashboard/admin-queries'
import { redirect } from 'next/navigation'

interface AdminStudentDetailPageProps {
    params: Promise<{ studentId: string }>
}

export default async function AdminStudentDetailPage({ params }: AdminStudentDetailPageProps) {
    const session = await auth()
    const role = session?.user?.role
    const userId = session?.user?.id

    if ((role !== 'SCHOOL_ADMIN' && role !== 'SUPERADMIN') || !userId) {
        redirect('/dashboard/no-autorizado')
    }

    const { studentId } = await params
    const student = await getAdminStudentDetail(userId, studentId)

    if (!student) {
        redirect('/dashboard/no-autorizado')
    }

    return <AdminStudentDetail student={student} />
}