import { auth } from '@/auth'
import { notFound, redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'
import { getAdminPostById } from '@/lib/blog/queries'
import { PostForm } from '@/components/dashboard/admin/PostForm'

interface AdminBlogEditPageProps {
    params: Promise<{ postId: string }>
}

export default async function AdminBlogEditPage({ params }: AdminBlogEditPageProps) {
    const session = await auth()

    if (!session?.user?.id || !hasAnyRole(session.user, ['SCHOOL_ADMIN', 'SUPERADMIN'])) {
        redirect('/no-autorizado')
    }

    const { postId } = await params
    const post = await getAdminPostById(postId)

    if (!post) {
        notFound()
    }

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Administración</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">Editar artículo</h1>
            <div className="mt-7">
                <PostForm initial={post} mode="edit" />
            </div>
        </main>
    )
}
