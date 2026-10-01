import type { Metadata } from 'next'
import { Newspaper } from 'lucide-react'
import { SITE } from '@/lib/seo'
import { getPublishedPosts } from '@/lib/blog/queries'
import { isPostCategory } from '@/lib/blog/categories'
import { BlogCard } from '@/components/blog/BlogCard'
import { BlogCategoryFilter } from '@/components/blog/BlogCategoryFilter'
import { BlogPagination } from '@/components/blog/BlogPagination'

export const metadata: Metadata = {
    title: 'Blog de karate: filosofía, guías y testimonios',
    description: 'Artículos sobre filosofía marcial, guías para padres, testimonios y contenido educativo de Tosei Gusoku Dojo, escuela de Karate Shito Ryu Inoue Ha en Santo Domingo.',
    alternates: { canonical: `${SITE.url}/blog` },
    openGraph: {
        title: 'Blog | Tosei Gusoku Dojo',
        description: 'Filosofía marcial, guías para padres, testimonios y contenido educativo sobre Karate Shito Ryu.',
        url: `${SITE.url}/blog`,
        images: [{ url: `${SITE.url}${SITE.ogImage}`, width: 1200, height: 630 }],
    },
}

interface BlogPageProps {
    searchParams: Promise<{ categoria?: string; pagina?: string }>
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
    const params = await searchParams
    const category = isPostCategory(params.categoria) ? params.categoria : null
    const requestedPage = Number.parseInt(params.pagina ?? '1', 10)
    const { posts, page, totalPages, total } = await getPublishedPosts({ category, page: Number.isFinite(requestedPage) ? requestedPage : 1 })

    return (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <header className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-widest text-brand-accent">Blog del dojo</p>
                <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight text-gray-800 sm:text-5xl">Camino marcial, fuera y dentro del tatami</h1>
                <p className="mt-4 text-base leading-relaxed text-gray-600">
                    Reflexiones, guías para familias y material educativo de Tosei Gusoku Dojo.
                </p>
            </header>

            <div className="mt-8">
                <BlogCategoryFilter active={category} />
            </div>

            {total === 0 ? (
                <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
                    <Newspaper aria-hidden="true" className="size-7 text-gray-300" />
                    <p className="text-sm font-semibold text-gray-600">Aún no hay artículos publicados{category ? ' en esta categoría' : ''}.</p>
                </div>
            ) : (
                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post) => <BlogCard key={post.id} post={post} />)}
                </div>
            )}

            <BlogPagination category={category} page={page} totalPages={totalPages} />
        </section>
    )
}
