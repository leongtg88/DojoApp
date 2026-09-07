import { auth } from '@/auth'
import { AdminCurriculumCatalog } from '@/components/dashboard/admin/AdminCurriculumCatalog'
import { AdminTechniqueManager } from '@/components/dashboard/admin/AdminTechniqueManager'
import { getAdminCurriculum } from '@/lib/dashboard/admin-queries'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

export default async function AdminCurriculumPage() {
    const session = await auth()
    const userId = session?.user?.id

    if (!hasAnyRole(session?.user, ['SCHOOL_ADMIN', 'SUPERADMIN']) || !userId) {
        redirect('/no-autorizado')
    }

    const curriculum = await getAdminCurriculum(userId)

    if (!curriculum) {
        redirect('/no-autorizado')
    }

    return (
        <>
            <AdminCurriculumCatalog ranks={curriculum.ranks} techniques={curriculum.techniques} />
            <div className="mt-8 border-t border-neutral-800" />
            <AdminTechniqueManager ranks={curriculum.ranks} techniques={curriculum.techniques} />
        </>
    )
}