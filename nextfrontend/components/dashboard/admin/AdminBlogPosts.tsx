'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Newspaper, Pencil, Plus, Trash2 } from 'lucide-react'
import { deletePost, setPostPublished } from '@/lib/blog/actions'
import { POST_CATEGORY_LABELS } from '@/lib/blog/categories'
import { formatDate } from '@/lib/format/datetime'
import type { AdminPostItem } from '@/types/blog'

interface AdminBlogPostsProps {
    posts: AdminPostItem[]
}

type Filter = 'ALL' | 'PUBLISHED' | 'DRAFT'

const FILTERS: { key: Filter; label: string }[] = [
    { key: 'ALL', label: 'Todos' },
    { key: 'PUBLISHED', label: 'Publicados' },
    { key: 'DRAFT', label: 'Borradores' },
]

export function AdminBlogPosts({ posts }: AdminBlogPostsProps) {
    const router = useRouter()
    const [filter, setFilter] = useState<Filter>('ALL')
    const [busyId, setBusyId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [, startTransition] = useTransition()

    const visible = useMemo(() => {
        if (filter === 'PUBLISHED') return posts.filter((post) => post.published)
        if (filter === 'DRAFT') return posts.filter((post) => !post.published)
        return posts
    }, [filter, posts])

    const publishedCount = posts.filter((post) => post.published).length

    function run(id: string, task: () => Promise<{ ok: boolean; error?: string }>) {
        setBusyId(id)
        setError(null)
        startTransition(async () => {
            const result = await task()
            setBusyId(null)
            if (!result.ok) {
                setError(result.error ?? 'Ocurrió un error.')
                return
            }
            router.refresh()
        })
    }

    function togglePublished(post: AdminPostItem) {
        run(post.id, () => setPostPublished({ id: post.id, published: !post.published }))
    }

    function remove(post: AdminPostItem) {
        if (!window.confirm(`¿Eliminar "${post.title}" permanentemente? Esta acción no se puede deshacer.`)) return
        run(post.id, () => deletePost({ id: post.id }))
    }

    return (
        <div>
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">Administración</p>
                    <h1 className="mt-2 font-display text-2xl font-extrabold text-ink">Blog</h1>
                    <p className="mt-2 max-w-xl text-xs text-ink-3">Crea, edita y publica los artículos del blog del dojo.</p>
                </div>
                <Link className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400" href="/dashboard/admin/blog/nuevo">
                    <Plus aria-hidden="true" className="size-4" />Nuevo artículo
                </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
                {FILTERS.map((item) => (
                    <button
                        className={`rounded-md border px-3 py-1.5 text-xs font-bold transition-colors ${filter === item.key ? 'border-cyan-500 bg-cyan-500 text-[#0d1117]' : 'border-edge-strong bg-surface-1 text-ink-2 hover:bg-surface-3'}`}
                        key={item.key}
                        onClick={() => setFilter(item.key)}
                        type="button"
                    >
                        {item.label}
                    </button>
                ))}
                <span className="ml-auto text-xs font-semibold text-ink-4">{publishedCount} publicados · {posts.length - publishedCount} borradores</span>
            </div>

            {error && <p className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-danger-text">{error}</p>}

            {visible.length === 0 ? (
                <p className="mt-6 rounded-lg border border-dashed border-edge-strong bg-surface-2 px-5 py-10 text-center text-xs text-ink-3">
                    {posts.length === 0 ? 'Aún no hay artículos. Crea el primero.' : 'No hay artículos en este filtro.'}
                </p>
            ) : (
                <ul className="mt-6 divide-y divide-edge rounded-lg border border-edge bg-surface-2 shadow-sm">
                    {visible.map((post) => (
                        <li className={`flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap ${busyId === post.id ? 'opacity-60' : ''}`} key={post.id}>
                            <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md border border-edge bg-surface-1">
                                {post.coverImageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img alt="" className="size-full object-cover" src={post.coverImageUrl} />
                                ) : (
                                    <div className="flex size-full items-center justify-center text-ink-4"><Newspaper aria-hidden="true" className="size-5" /></div>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded border border-edge-strong bg-surface-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-2">{POST_CATEGORY_LABELS[post.category]}</span>
                                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${post.published ? 'border-emerald-500/40 bg-emerald-500/10 text-ok-text' : 'border-amber-500/40 bg-amber-500/10 text-warn-text'}`}>
                                        {post.published ? 'Publicado' : 'Borrador'}
                                    </span>
                                </div>
                                <p className="mt-1.5 truncate text-sm font-semibold text-ink">{post.title}</p>
                                <p className="mt-0.5 truncate text-xs text-ink-4">
                                    /blog/{post.slug}
                                    {post.publishedAt ? ` · ${formatDate(post.publishedAt)}` : ` · actualizado ${formatDate(post.updatedAt)}`}
                                </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                <button
                                    className="inline-flex items-center gap-1.5 rounded-md border border-edge-strong bg-surface-1 px-2.5 py-1.5 text-xs font-semibold text-ink-2 transition-colors hover:bg-surface-3 disabled:opacity-50"
                                    disabled={busyId === post.id}
                                    onClick={() => togglePublished(post)}
                                    type="button"
                                >
                                    {busyId === post.id ? <Loader2 aria-label="Procesando" className="size-3.5 animate-spin" /> : post.published ? <EyeOff aria-hidden="true" className="size-3.5" /> : <Eye aria-hidden="true" className="size-3.5" />}
                                    {post.published ? 'Despublicar' : 'Publicar'}
                                </button>
                                <Link
                                    className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-semibold text-accent-text transition-colors hover:bg-cyan-500/20"
                                    href={`/dashboard/admin/blog/${post.id}`}
                                >
                                    <Pencil aria-hidden="true" className="size-3.5" />Editar
                                </Link>
                                <button
                                    aria-label={`Eliminar ${post.title}`}
                                    className="inline-flex items-center rounded-md border border-red-500/30 bg-red-500/10 p-1.5 text-danger-text transition-colors hover:bg-red-500/20 disabled:opacity-50"
                                    disabled={busyId === post.id}
                                    onClick={() => remove(post)}
                                    type="button"
                                >
                                    <Trash2 aria-hidden="true" className="size-3.5" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
