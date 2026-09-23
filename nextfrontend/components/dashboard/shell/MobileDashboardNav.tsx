'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { DashboardRole } from '@/types/dashboard'
import { getRoleNavigation } from './RoleNavigation'

interface MobileDashboardNavProps {
    activeRole: DashboardRole
    pendingEnrollmentCount?: number
    pendingDocumentCount?: number
}

export function MobileDashboardNav({ activeRole, pendingEnrollmentCount = 0, pendingDocumentCount = 0 }: MobileDashboardNavProps) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const activeStudentId = searchParams.get('estudiante')
    const navigation = getRoleNavigation(activeRole, pendingEnrollmentCount, pendingDocumentCount)
    const currentHref = navigation
        .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
        .sort((a, b) => b.href.length - a.href.length)[0]?.href
    const withStudentContext = (href: string) => {
        if (activeRole !== 'STUDENT' || !activeStudentId) return href
        return `${href}${href.includes('?') ? '&' : '?'}estudiante=${encodeURIComponent(activeStudentId)}`
    }

    return (
        <nav
            aria-label="Navegación móvil del dashboard"
            className="fixed inset-x-0 bottom-0 z-40 border-t border-edge bg-surface-2/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.35)] backdrop-blur md:hidden print:hidden"
        >
            <div className="flex h-16 items-center gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain px-2 touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {navigation.map(({ href, icon: Icon, label, badge }) => {
                    const active = href === currentHref

                    return (
                        <Link
                            className={`relative flex h-14 min-w-14 flex-1 flex-col items-center justify-center gap-1 px-1 text-center text-[10px] font-semibold ${active ? 'text-accent' : 'text-ink-4'
                                }`}
                            href={withStudentContext(href)}
                            key={href}
                        >
                            <span className="relative">
                                <Icon aria-hidden="true" className="size-5" />
                                {badge && <span className="absolute -right-2 -top-1.5 rounded-full bg-cyan-500 px-1.5 py-0.5 text-[9px] font-bold leading-none text-[#0d1117]">{badge > 99 ? '99+' : badge}</span>}
                            </span>
                            <span className="max-w-16 truncate">{label}</span>
                            {active && <span aria-hidden="true" className="absolute bottom-1 h-0.5 w-7 bg-cyan-400" />}
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
