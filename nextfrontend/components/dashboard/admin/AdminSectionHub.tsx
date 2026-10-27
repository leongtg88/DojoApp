import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface AdminHubItem {
    href: string
    title: string
    description: string
    icon: LucideIcon
}

interface AdminSectionHubProps {
    eyebrow: string
    title: string
    description: string
    items: AdminHubItem[]
}

/** UX-B5 · Hub de una sección del admin: cada tarjeta lleva a una pantalla real. */
export function AdminSectionHub({ eyebrow, title, description, items }: AdminSectionHubProps) {
    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">{eyebrow}</p>
            <h1 className="mt-2 font-display text-2xl font-extrabold text-ink">{title}</h1>
            <p className="mt-2 max-w-2xl text-xs text-ink-3">{description}</p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {items.map(({ href, title: itemTitle, description: itemDescription, icon: Icon }) => (
                    <Link
                        className="group flex min-h-24 items-start gap-4 rounded-lg border border-edge bg-surface-2 p-5 transition-colors hover:border-cyan-500/40 hover:bg-surface-3"
                        href={href}
                        key={href}
                    >
                        <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-accent">
                            <Icon aria-hidden="true" className="size-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                                <span className="font-display text-base font-bold text-ink">{itemTitle}</span>
                                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5" />
                            </span>
                            <span className="mt-1 block text-xs text-ink-3">{itemDescription}</span>
                        </span>
                    </Link>
                ))}
            </div>
        </main>
    )
}
