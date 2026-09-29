'use client'

import { useEffect, useState } from 'react'
import Link, { useLinkStatus } from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import type { DashboardRole } from '@/types/dashboard'
import { getRoleNavigation } from './RoleNavigation'

interface MobileDashboardNavProps {
    activeRole: DashboardRole
    pendingEnrollmentCount?: number
    newStudentCount?: number
}

interface NavLinkContentProps {
    active: boolean
    label: string
    icon: LucideIcon
    badge?: number
    href: string
    pendingHref: string | null
    onPendingChange: (href: string | null) => void
}

function NavLinkContent({ active, label, icon: Icon, badge, href, pendingHref, onPendingChange }: NavLinkContentProps) {
    const { pending } = useLinkStatus()

    useEffect(() => {
        onPendingChange(pending ? href : null)
    }, [pending, href, onPendingChange])

    const isThisPending = pending || pendingHref === href
    const suppressedActive = active && pendingHref !== null && !isThisPending

    const contentClass = isThisPending
        ? 'mobile-nav-text-pending'
        : suppressedActive || !active
            ? 'text-ink-4'
            : 'text-accent'

    const underlineClass = isThisPending
        ? 'mobile-nav-underline-pending'
        : suppressedActive
            ? ''
            : active
                ? 'mobile-nav-underline-active'
                : ''

    return (
        <>
            <span className={`flex flex-col items-center gap-1 ${contentClass}`}>
                <span className="relative">
                    <Icon aria-hidden="true" className="size-5" />
                    {badge && <span className="absolute -right-2 -top-1.5 rounded-full bg-cyan-500 px-1.5 py-0.5 text-[9px] font-bold leading-none text-[#0d1117]">{badge > 99 ? '99+' : badge}</span>}
                </span>
                <span className="max-w-16 truncate">{label}</span>
            </span>
            <span aria-hidden="true" className={`mobile-nav-underline ${underlineClass}`} />
        </>
    )
}

export function MobileDashboardNav({ activeRole, pendingEnrollmentCount = 0, newStudentCount = 0 }: MobileDashboardNavProps) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const activeStudentId = searchParams.get('estudiante')
    const navigation = getRoleNavigation(activeRole, pendingEnrollmentCount, newStudentCount)
    const [pendingHref, setPendingHref] = useState<string | null>(null)
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
            className="sticky bottom-0 z-40 border-t border-edge bg-surface-2/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.35)] backdrop-blur md:hidden print:hidden"
        >
            <div className="flex h-16 items-center gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain px-2 pb-2 touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {navigation.map(({ href, icon: Icon, label, badge }) => {
                    const active = href === currentHref
                    const linkHref = withStudentContext(href)

                    return (
                        <Link
                            className="relative flex h-14 min-w-14 flex-1 origin-center flex-col items-center justify-center gap-1 px-1 text-center text-[10px] font-semibold transition-transform duration-150 hover:scale-105 active:scale-110 motion-reduce:transform-none"
                            href={linkHref}
                            key={href}
                        >
                            <NavLinkContent active={active} label={label} icon={Icon} badge={badge} href={linkHref} pendingHref={pendingHref} onPendingChange={setPendingHref} />
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
