import type { PostCategory } from '@/lib/generated/prisma'
import { POST_CATEGORY_BADGE_CLASSES, POST_CATEGORY_LABELS } from '@/lib/blog/categories'

interface BlogCategoryBadgeProps {
    category: PostCategory
    className?: string
}

export function BlogCategoryBadge({ category, className = '' }: BlogCategoryBadgeProps) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${POST_CATEGORY_BADGE_CLASSES[category]} ${className}`}>
            {POST_CATEGORY_LABELS[category]}
        </span>
    )
}
