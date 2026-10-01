import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PostCategory } from '@/lib/generated/prisma'

interface BlogPaginationProps {
    page: number
    totalPages: number
    category: PostCategory | null
}

function buildHref(page: number, category: PostCategory | null): string {
    const params = new URLSearchParams()
    if (category) params.set('categoria', category)
    if (page > 1) params.set('pagina', String(page))
    const query = params.toString()
    return query ? `/blog?${query}` : '/blog'
}

export function BlogPagination({ page, totalPages, category }: BlogPaginationProps) {
    if (totalPages <= 1) return null

    const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
    const linkClass = 'inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-semibold transition-colors'

    return (
        <nav aria-label="Paginación del blog" className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {page > 1 ? (
                <Link aria-label="Página anterior" className={`${linkClass} border-gray-200 bg-white text-gray-600 hover:border-brand-accent/60 hover:text-brand-accent`} href={buildHref(page - 1, category)}>
                    <ChevronLeft aria-hidden="true" className="size-4" />Anterior
                </Link>
            ) : (
                <span className={`${linkClass} cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300`}><ChevronLeft aria-hidden="true" className="size-4" />Anterior</span>
            )}

            {pages.map((item) => (
                <Link
                    aria-current={item === page ? 'page' : undefined}
                    className={`${linkClass} ${item === page ? 'border-brand-accent bg-brand-accent text-gray-800' : 'border-gray-200 bg-white text-gray-600 hover:border-brand-accent/60 hover:text-brand-accent'}`}
                    href={buildHref(item, category)}
                    key={item}
                >
                    {item}
                </Link>
            ))}

            {page < totalPages ? (
                <Link aria-label="Página siguiente" className={`${linkClass} border-gray-200 bg-white text-gray-600 hover:border-brand-accent/60 hover:text-brand-accent`} href={buildHref(page + 1, category)}>
                    Siguiente<ChevronRight aria-hidden="true" className="size-4" />
                </Link>
            ) : (
                <span className={`${linkClass} cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300`}>Siguiente<ChevronRight aria-hidden="true" className="size-4" /></span>
            )}
        </nav>
    )
}
