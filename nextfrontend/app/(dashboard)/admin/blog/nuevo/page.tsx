import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'
import { PostForm } from '@/components/dashboard/admin/PostForm'

export default async function AdminBlogNewPage() {
    const session = await auth()

    if (!session?.user?.id || !hasAnyRole(session.user, ['SCHOOL_ADMIN', 'SUPERADMIN'])) {
        redirect('/no-autorizado')
    }

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Administración</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">Nuevo artículo</h1>
            <div className="mt-7">
                <PostForm mode="create" />
            </div>
        </main>
    )
}
