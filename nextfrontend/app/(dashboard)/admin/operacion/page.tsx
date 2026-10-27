import { auth } from '@/auth'
import { AdminSectionHub } from '@/components/dashboard/admin/AdminSectionHub'
import { hasAnyRole } from '@/lib/auth/roles'
import { redirect } from 'next/navigation'
import { ClipboardCheck, Clock3 } from 'lucide-react'

export default async function AdminOperationsPage() {
    const session = await auth()

    if (!hasAnyRole(session?.user, ['SCHOOL_ADMIN', 'SUPERADMIN'])) {
        redirect('/no-autorizado')
    }

    return (
        <AdminSectionHub
            description="La asistencia del día, las reposiciones y el balance de horas."
            eyebrow="Administración"
            items={[
                {
                    href: '/dashboard/admin/asistencia',
                    title: 'Asistencia y reposiciones',
                    description: 'Pase de lista, clases online de 35 min y política de faltas.',
                    icon: ClipboardCheck,
                },
                {
                    href: '/dashboard/admin/balance',
                    title: 'Balance de horas',
                    description: 'Horas confirmadas, esperadas y desviaciones por alumno.',
                    icon: Clock3,
                },
            ]}
            title="Operación"
        />
    )
}
