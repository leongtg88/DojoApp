'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { DashboardRole } from '@/types/dashboard'
import { getRoleNavigation } from './RoleNavigation'

interface DashboardSidebarProps {
    role: DashboardRole
    userName: string | null | undefined
}

export function DashboardSidebar({ role, userName }: DashboardSidebarProps) {
    const pathname = usePathname()
    const navigation = getRoleNavigation(role)

    return (
        <aside className="hidden w-64 shrink-0 border-r border-[#e5e2e1] bg-white p-5 md:flex md:min-h-[calc(100vh-4rem)] md:flex-col">
            <div className="mb-7 rounded-lg border border-[#e5e2e1] bg-[#f6f3f2] p-4">
                <p className="truncate text-sm font-bold text-[#1c1b1b]">{userName ?? 'Usuario'}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#8a7400]">{role.replace('_', ' ')}</p>
            </div>

            <nav className="flex flex-col gap-1" aria-label="Navegación del dashboard">
                {navigation.map(({ href, icon: Icon, label }) => {
                    const active = pathname === href || (href !== navigation[0]?.href && pathname.startsWith(`${href}/`))

                    return (
                        <Link
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${active ? 'bg-[#b70011] text-white' : 'text-[#5c403c] hover:bg-[#f6f3f2] hover:text-[#1c1b1b]'
                                }`}
                            href={href}
                            key={href}
                        >
                            <Icon aria-hidden="true" className="size-4" />
                            {label}
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}
