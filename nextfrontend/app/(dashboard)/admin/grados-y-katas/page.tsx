import { auth } from '@/auth'
import { AdminCurriculumCatalog } from '@/components/dashboard/admin/AdminCurriculumCatalog'
import { getAdminBeltRanks } from '@/lib/dashboard/admin-queries'
import { redirect } from 'next/navigation'

export default async function AdminCurriculumPage() {
    const session = await auth()
    const role = session?.user?.role
    const userId = session?.user?.id

    if ((role !== 'SCHOOL_ADMIN' && role !== 'SUPERADMIN') || !userId) {
        redirect('/dashboard/no-autorizado')
    }

    const ranks = await getAdminBeltRanks(userId)

    if (!ranks) {
        redirect('/dashboard/no-autorizado')
    }

    return <AdminCurriculumCatalog ranks={ranks} />
}