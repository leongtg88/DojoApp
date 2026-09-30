import { auth } from '@/auth'
import { AdminStudents } from '@/components/dashboard/admin/AdminStudents'
import { getAdminStudents } from '@/lib/dashboard/admin-queries'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

interface AdminStudentsPageProps {
    searchParams: Promise<{ docs?: string }>
}

export default async function AdminStudentsPage({ searchParams }: AdminStudentsPageProps) {
    const session = await auth()
    const userId = session?.user?.id

    if (!hasAnyRole(session?.user, ['SCHOOL_ADMIN', 'SUPERADMIN']) || !userId) {
        redirect('/no-autorizado')
    }

    const { docs } = await searchParams
    const students = await getAdminStudents(userId)

    if (!students) {
        redirect('/no-autorizado')
    }

    return <AdminStudents initialDocsOnly={docs === 'pending'} students={students} />
}