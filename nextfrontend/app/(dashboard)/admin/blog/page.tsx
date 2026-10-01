import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'
import { getAdminPosts } from '@/lib/blog/queries'
import { AdminBlogPosts } from '@/components/dashboard/admin/AdminBlogPosts'

export default async function AdminBlogPage() {
    const session = await auth()

    if (!session?.user?.id || !hasAnyRole(session.user, ['SCHOOL_ADMIN', 'SUPERADMIN'])) {
        redirect('/no-autorizado')
    }

    const posts = await getAdminPosts()

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <AdminBlogPosts posts={posts} />
        </main>
    )
}
