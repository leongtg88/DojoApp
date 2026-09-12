'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { DashboardRole } from '@/types/dashboard'
import { getRoleNavigation } from './RoleNavigation'

interface MobileDashboardNavProps {
    activeRole: DashboardRole
    pendingEnrollmentCount?: number
}

export function MobileDashboardNav({ activeRole, pendingEnrollmentCount = 0 }: MobileDashboardNavProps) {
    const pathname = usePathname()
    const navigation = getRoleNavigation(activeRole, pendingEnrollmentCount).slice(0, 5)

    return (
        <nav
            aria-label="Navegación móvil del dashboard"
            className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-800 bg-[#161b22]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.35)] backdrop-blur md:hidden"
        >
            <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-1">
                {navigation.map(({ href, icon: Icon, label, badge }) => {
                    const active = pathname === href || (href !== navigation[0]?.href && pathname.startsWith(`${href}/`))

                    return (
                        <Link
                            className={`relative flex h-14 min-w-14 flex-col items-center justify-center gap-1 px-1 text-center text-[10px] font-semibold ${active ? 'text-cyan-300' : 'text-neutral-500'
                                }`}
                            href={href}
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
