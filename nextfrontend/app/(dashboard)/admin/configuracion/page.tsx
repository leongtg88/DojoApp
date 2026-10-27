import { auth } from '@/auth'
import { AdminSectionHub } from '@/components/dashboard/admin/AdminSectionHub'
import { hasAnyRole } from '@/lib/auth/roles'
import { redirect } from 'next/navigation'
import { CalendarClock, CalendarDays, GraduationCap, ListChecks } from 'lucide-react'

export default async function AdminConfigurationPage() {
    const session = await auth()

    if (!hasAnyRole(session?.user, ['SCHOOL_ADMIN', 'SUPERADMIN'])) {
        redirect('/no-autorizado')
    }

    return (
        <AdminSectionHub
            description="Los horarios, el calendario, los planes y el catálogo marcial del dojo."
            eyebrow="Administración"
            items={[
                {
                    href: '/dashboard/admin/horarios',
                    title: 'Horarios',
                    description: 'Grupos, días, horas e instructores.',
                    icon: CalendarDays,
                },
                {
                    href: '/dashboard/admin/calendario',
                    title: 'Calendario',
                    description: 'Feriados, convocatorias de examen y cierres.',
                    icon: CalendarClock,
                },
                {
                    href: '/dashboard/admin/planes',
                    title: 'Planes',
                    description: 'Mensualidades, precios y condiciones.',
                    icon: ListChecks,
                },
                {
                    href: '/dashboard/admin/grados-y-katas',
                    title: 'Grados y katas',
                    description: 'Cinturones, katas y técnicas por grado.',
                    icon: GraduationCap,
                },
            ]}
            title="Configuración"
        />
    )
}
