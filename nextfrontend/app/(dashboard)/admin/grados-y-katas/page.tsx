import { auth } from '@/auth'
import { AdminCurriculumCatalog } from '@/components/dashboard/admin/AdminCurriculumCatalog'
import { AdminTechniqueManager } from '@/components/dashboard/admin/AdminTechniqueManager'
import { getAdminCurriculum } from '@/lib/dashboard/admin-queries'
import { redirect } from 'next/navigation'

export default async function AdminCurriculumPage() {
    const session = await auth()
    const role = session?.user?.role
    const userId = session?.user?.id

    if ((role !== 'SCHOOL_ADMIN' && role !== 'SUPERADMIN') || !userId) {
        redirect('/dashboard/no-autorizado')
    }

    const curriculum = await getAdminCurriculum(userId)

    if (!curriculum) {
        redirect('/dashboard/no-autorizado')
    }

    return (
        <>
            <AdminCurriculumCatalog ranks={curriculum.ranks} techniques={curriculum.techniques} />
            <div className="mt-8 border-t border-neutral-800" />
            <AdminTechniqueManager ranks={curriculum.ranks} techniques={curriculum.techniques} />
        </>
    )
}