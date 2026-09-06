'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import type { DashboardRole } from '@/types/dashboard'
import { getRoleNavigation } from './RoleNavigation'

interface MobileDashboardNavProps {
	 onSignOut: () => void
    role: DashboardRole
}

export function MobileDashboardNav({ onSignOut, role }: MobileDashboardNavProps) {
    const pathname = usePathname()
    const navigation = getRoleNavigation(role).slice(0, 5)

    return (
        <nav
            aria-label="Navegación móvil del dashboard"
            className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-800 bg-[#161b22]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.35)] backdrop-blur md:hidden"
        >
            <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-1">
                {navigation.map(({ href, icon: Icon, label }) => {
                    const active = pathname === href || (href !== navigation[0]?.href && pathname.startsWith(`${href}/`))

                    return (
                        <Link
                            className={`relative flex h-14 min-w-14 flex-col items-center justify-center gap-1 px-1 text-center text-[10px] font-semibold ${active ? 'text-cyan-300' : 'text-neutral-500'
                                }`}
                            href={href}
                            key={href}
                        >
                            <Icon aria-hidden="true" className="size-5" />
                            <span className="max-w-16 truncate">{label}</span>
                            {active && <span aria-hidden="true" className="absolute bottom-1 h-0.5 w-7 bg-cyan-400" />}
                        </Link>
                    )
                })}
                <button aria-label="Cerrar sesión" className="flex h-14 min-w-14 flex-col items-center justify-center gap-1 px-1 text-center text-[10px] font-semibold text-neutral-500 hover:text-red-300" onClick={onSignOut} title="Cerrar sesión" type="button"><LogOut aria-hidden="true" className="size-5" /><span className="max-w-16 truncate">Salir</span></button>
            </div>
        </nav>
    )
}
