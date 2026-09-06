'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { DashboardRole } from '@/types/dashboard'
import { getRoleNavigation } from './RoleNavigation'

interface MobileDashboardNavProps {
    role: DashboardRole
}

export function MobileDashboardNav({ role }: MobileDashboardNavProps) {
    const pathname = usePathname()
    const navigation = getRoleNavigation(role).slice(0, 5)

    return (
        <nav
            aria-label="Navegación móvil del dashboard"
            className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e5e2e1] bg-[#fcf9f8]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        >
            <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-1">
                {navigation.map(({ href, icon: Icon, label }) => {
                    const active = pathname === href || (href !== navigation[0]?.href && pathname.startsWith(`${href}/`))

                    return (
                        <Link
                            className={`flex h-14 min-w-14 flex-col items-center justify-center gap-1 px-1 text-center text-[10px] font-semibold ${active ? 'text-[#b70011]' : 'text-[#5c403c]'
                                }`}
                            href={href}
                            key={href}
                        >
                            <Icon aria-hidden="true" className="size-5" />
                            <span className="max-w-16 truncate">{label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
