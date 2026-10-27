import { auth } from '@/auth'
import { AdminSectionHub } from '@/components/dashboard/admin/AdminSectionHub'
import { hasAnyRole } from '@/lib/auth/roles'
import { redirect } from 'next/navigation'
import { MessageCircle, Newspaper, Star } from 'lucide-react'

export default async function AdminCommunicationPage() {
    const session = await auth()

    if (!hasAnyRole(session?.user, ['SCHOOL_ADMIN', 'SUPERADMIN'])) {
        redirect('/no-autorizado')
    }

    return (
        <AdminSectionHub
            description="Mensajes con alumnos y tutores, reseñas del sitio y blog del dojo."
            eyebrow="Administración"
            items={[
                {
                    href: '/dashboard/admin/mensajes',
                    title: 'Mensajes',
                    description: 'Conversaciones con alumnos y tutores.',
                    icon: MessageCircle,
                },
                {
                    href: '/dashboard/admin/reviews',
                    title: 'Reseñas',
                    description: 'Moderación de las reseñas públicas.',
                    icon: Star,
                },
                {
                    href: '/dashboard/admin/blog',
                    title: 'Blog',
                    description: 'Artículos y publicaciones del dojo.',
                    icon: Newspaper,
                },
            ]}
            title="Comunicación"
        />
    )
}
