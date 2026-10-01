import Link from 'next/link'
import type { PostCategory } from '@/lib/generated/prisma'
import { POST_CATEGORIES, POST_CATEGORY_LABELS } from '@/lib/blog/categories'

interface BlogCategoryFilterProps {
    active: PostCategory | null
}

const BASE = 'rounded-full border px-4 py-2 text-sm font-semibold transition-colors'
const ACTIVE = 'border-brand-accent bg-brand-accent text-gray-800'
const IDLE = 'border-gray-200 bg-white text-gray-600 hover:border-brand-accent/60 hover:text-brand-accent'

export function BlogCategoryFilter({ active }: BlogCategoryFilterProps) {
    return (
        <div aria-label="Filtrar por categoría" className="flex flex-wrap items-center gap-2">
            <Link className={`${BASE} ${!active ? ACTIVE : IDLE}`} href="/blog">Todas</Link>
            {POST_CATEGORIES.map((category) => (
                <Link className={`${BASE} ${active === category ? ACTIVE : IDLE}`} href={`/blog?categoria=${category}`} key={category}>
                    {POST_CATEGORY_LABELS[category]}
                </Link>
            ))}
        </div>
    )
}
