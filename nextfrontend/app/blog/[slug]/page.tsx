import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { SITE } from '@/lib/seo'
import { getPublishedPostBySlug } from '@/lib/blog/queries'
import { formatDate } from '@/lib/format/datetime'
import { BlogCategoryBadge } from '@/components/blog/BlogCategoryBadge'
import { MarkdownContent } from '@/components/blog/MarkdownContent'
import JsonLd from '@/components/JsonLd'

interface BlogPostPageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
    const { slug } = await params
    const post = await getPublishedPostBySlug(slug)

    if (!post) {
        return { title: 'Artículo no encontrado' }
    }

    const url = `${SITE.url}/blog/${post.slug}`
    const image = post.coverImageUrl ?? `${SITE.url}${SITE.ogImage}`

    return {
        title: post.title,
        description: post.excerpt,
        alternates: { canonical: url },
        openGraph: {
            type: 'article',
            title: post.title,
            description: post.excerpt,
            url,
            images: [{ url: image, width: 1200, height: 630, alt: post.title }],
            publishedTime: post.publishedAt ?? undefined,
            authors: post.authorName ? [post.authorName] : undefined,
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.excerpt,
            images: [image],
        },
    }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug } = await params
    const post = await getPublishedPostBySlug(slug)

    if (!post) {
        notFound()
    }

    const url = `${SITE.url}/blog/${post.slug}`
    const image = post.coverImageUrl ?? `${SITE.url}${SITE.ogImage}`

    return (
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
            <JsonLd
                data={{
                    '@context': 'https://schema.org',
                    '@type': 'BlogPosting',
                    headline: post.title,
                    description: post.excerpt,
                    image,
                    datePublished: post.publishedAt,
                    dateModified: post.updatedAt,
                    author: { '@type': 'Organization', name: post.authorName ?? SITE.name },
                    publisher: {
                        '@type': 'Organization',
                        name: SITE.name,
                        logo: { '@type': 'ImageObject', url: `${SITE.url}/assets/LogoSolo.svg` },
                    },
                    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
                }}
                id={`blog-post-${post.slug}`}
            />

            <Link className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-brand-accent" href="/blog">
                <ArrowLeft aria-hidden="true" className="size-4" />Volver al blog
            </Link>

            <header className="mt-6">
                <BlogCategoryBadge category={post.category} />
                <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-gray-800 sm:text-5xl">{post.title}</h1>
                <p className="mt-4 text-lg leading-relaxed text-gray-600">{post.excerpt}</p>
                <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                    {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
                    {post.authorName && <><span aria-hidden="true">·</span><span>{post.authorName}</span></>}
                </div>
            </header>

            {post.coverImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={post.title} className="mt-8 aspect-video w-full rounded-xl border border-gray-200 object-cover shadow-sm" src={post.coverImageUrl} />
            )}

            <div className="mt-10">
                <MarkdownContent content={post.content} />
            </div>
        </article>
    )
}
