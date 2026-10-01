import Link from 'next/link'
import { ImageOff } from 'lucide-react'
import { formatDate } from '@/lib/format/datetime'
import { BlogCategoryBadge } from './BlogCategoryBadge'
import type { PostCard } from '@/types/blog'

interface BlogCardProps {
    post: PostCard
}

export function BlogCard({ post }: BlogCardProps) {
    return (
        <article className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-accent/50 hover:shadow-xl">
            <Link aria-label={post.title} className="block" href={`/blog/${post.slug}`}>
                <div className="aspect-video overflow-hidden bg-gray-100">
                    {post.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt={post.title} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" src={post.coverImageUrl} />
                    ) : (
                        <div className="flex size-full items-center justify-center text-gray-300">
                            <ImageOff aria-hidden="true" className="size-8" />
                        </div>
                    )}
                </div>
            </Link>

            <div className="flex flex-1 flex-col p-5">
                <BlogCategoryBadge category={post.category} className="w-fit" />
                <h2 className="mt-3 font-display text-lg font-bold leading-snug text-gray-800">
                    <Link className="transition-colors hover:text-brand-accent" href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600">{post.excerpt}</p>
                {post.publishedAt && <time className="mt-4 block text-xs font-medium uppercase tracking-wide text-gray-400" dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
            </div>
        </article>
    )
}
