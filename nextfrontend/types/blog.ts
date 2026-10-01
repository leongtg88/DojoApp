import type { PostCategory } from '@/lib/generated/prisma'

export interface PostCard {
    id: string
    title: string
    slug: string
    excerpt: string
    coverImageUrl: string | null
    category: PostCategory
    publishedAt: string | null
}

export interface PostDetail extends PostCard {
    content: string
    authorName: string | null
    updatedAt: string
}

export interface AdminPostItem {
    id: string
    title: string
    slug: string
    excerpt: string
    category: PostCategory
    published: boolean
    publishedAt: string | null
    coverImageUrl: string | null
    updatedAt: string
    authorName: string | null
}

export interface PostFormValues {
    id?: string
    title: string
    slug: string
    excerpt: string
    content: string
    category: PostCategory
    published: boolean
    coverImageUrl: string | null
}
