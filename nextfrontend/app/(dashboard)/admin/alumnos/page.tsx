import { auth } from '@/auth'
import { AdminStudentsWorkspace } from '@/components/dashboard/admin/AdminStudentsWorkspace'
import { getAdminStudentDetail, getAdminStudents } from '@/lib/dashboard/admin-queries'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

interface AdminStudentsPageProps {
    searchParams: Promise<{ docs?: string; selected?: string }>
}

/**
 * UX-B8 · Ruta canónica de Alumnos.
 * - `/admin/alumnos` → padrón + expediente inline (o SlideOver en móvil).
 * - `/admin/alumnos/[studentId]` → página completa del expediente.
 */
export default async function AdminStudentsPage({ searchParams }: AdminStudentsPageProps) {
    const session = await auth()
    const userId = session?.user?.id

    if (!hasAnyRole(session?.user, ['SCHOOL_ADMIN', 'SUPERADMIN']) || !userId) {
        redirect('/no-autorizado')
    }

    const { docs, selected } = await searchParams
    const [students, detail] = await Promise.all([
        getAdminStudents(userId),
        selected ? getAdminStudentDetail(userId, selected) : Promise.resolve(null),
    ])

    if (!students) {
        redirect('/no-autorizado')
    }

    return (
        <AdminStudentsWorkspace
            detail={detail}
            initialDocsOnly={docs === 'pending'}
            selectedId={selected ?? null}
            students={students}
        />
    )
}
