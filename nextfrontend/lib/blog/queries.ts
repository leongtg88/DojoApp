import 'server-only'
import { cache } from 'react'
import { db } from '@/lib/db'
import type { PostCategory } from '@/lib/generated/prisma'
import type { AdminPostItem, PostCard, PostDetail, PostFormValues } from '@/types/blog'

export const PUBLIC_PAGE_SIZE = 9

interface PublishedPostsParams {
    category?: PostCategory | null
    page?: number
    pageSize?: number
}

export async function getPublishedPosts({ category = null, page = 1, pageSize = PUBLIC_PAGE_SIZE }: PublishedPostsParams) {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
    const where = { published: true, ...(category ? { category } : {}) }

    const [total, posts] = await Promise.all([
        db.post.count({ where }),
        db.post.findMany({
            where,
            orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
            skip: (safePage - 1) * pageSize,
            take: pageSize,
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                coverImageUrl: true,
                category: true,
                publishedAt: true,
            },
        }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    return {
        posts: posts.map<PostCard>((post) => ({ ...post, publishedAt: post.publishedAt?.toISOString() ?? null })),
        total,
        totalPages,
        page: Math.min(safePage, totalPages),
    }
}

// `cache` deduplica la consulta entre generateMetadata y el componente de página.
export const getPublishedPostBySlug = cache(async (slug: string): Promise<PostDetail | null> => {
    const post = await db.post.findFirst({
        where: { slug, published: true },
        select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            content: true,
            coverImageUrl: true,
            category: true,
            publishedAt: true,
            updatedAt: true,
            author: { select: { name: true } },
        },
    })

    if (!post) return null

    return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        coverImageUrl: post.coverImageUrl,
        category: post.category,
        publishedAt: post.publishedAt?.toISOString() ?? null,
        updatedAt: post.updatedAt.toISOString(),
        authorName: post.author.name,
    }
})

export async function getAdminPosts(): Promise<AdminPostItem[]> {
    const posts = await db.post.findMany({
        orderBy: [{ createdAt: 'desc' }],
        select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            category: true,
            published: true,
            publishedAt: true,
            coverImageUrl: true,
            updatedAt: true,
            author: { select: { name: true } },
        },
    })

    return posts.map<AdminPostItem>((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        category: post.category,
        published: post.published,
        publishedAt: post.publishedAt?.toISOString() ?? null,
        coverImageUrl: post.coverImageUrl,
        updatedAt: post.updatedAt.toISOString(),
        authorName: post.author.name,
    }))
}

export async function getAdminPostById(id: string): Promise<PostFormValues | null> {
    const post = await db.post.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            content: true,
            category: true,
            published: true,
            coverImageUrl: true,
        },
    })

    return post
}
