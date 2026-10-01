import type { PostCategory } from '@/lib/generated/prisma'

export const POST_CATEGORIES = ['FILOSOFIA', 'GUIA_PARA_PADRES', 'TESTIMONIOS', 'EDUCATIVO'] as const

export const POST_CATEGORY_LABELS: Record<PostCategory, string> = {
    FILOSOFIA: 'Filosofía',
    GUIA_PARA_PADRES: 'Guía para padres',
    TESTIMONIOS: 'Testimonios',
    EDUCATIVO: 'Educativo',
}

// Clases del badge "dorado sutil" (identidad de marca) para las cards públicas.
export const POST_CATEGORY_BADGE_CLASSES: Record<PostCategory, string> = {
    FILOSOFIA: 'border-brand-accent/40 bg-brand-accent/10 text-brand-accent',
    GUIA_PARA_PADRES: 'border-amber-500/40 bg-amber-500/10 text-amber-700',
    TESTIMONIOS: 'border-rose-500/30 bg-rose-500/10 text-rose-700',
    EDUCATIVO: 'border-sky-500/30 bg-sky-500/10 text-sky-700',
}

export function isPostCategory(value: string | undefined | null): value is PostCategory {
    return POST_CATEGORIES.includes(value as PostCategory)
}
