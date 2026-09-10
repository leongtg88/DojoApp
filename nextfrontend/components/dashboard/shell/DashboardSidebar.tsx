'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import type { DashboardRole } from '@/types/dashboard'
import { getRoleNavigation } from './RoleNavigation'
import { getPanelHref, getRolePanelOptions } from './RolePanels'

interface DashboardSidebarProps {
    onSignOut: () => void
    activeRole: DashboardRole
    roles: DashboardRole[]
    userName: string | null | undefined
    pendingEnrollmentCount?: number
}

export function DashboardSidebar({ onSignOut, activeRole, roles, userName, pendingEnrollmentCount = 0 }: DashboardSidebarProps) {
    const pathname = usePathname()
    const navigation = getRoleNavigation(activeRole, pendingEnrollmentCount)
    const activeHref = getPanelHref(activeRole)
    const switchOptions = getRolePanelOptions(roles).filter((option) => option.href !== activeHref)
    const initials = (userName ?? 'Usuario').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    const roleLabel = activeRole === 'STUDENT' ? 'Estudiante' : activeRole === 'INSTRUCTOR' ? 'Instructor' : 'Administrador'

    return (
        <aside className="hidden w-64 shrink-0 border-r border-neutral-800 bg-[#161b22] p-5 md:flex md:min-h-[calc(100vh-4rem)] md:flex-col">
            <div className="mb-7 flex items-center gap-3 border border-neutral-700 bg-[#0d1117] p-3.5 shadow-sm">
                <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 font-display text-sm font-extrabold text-cyan-100">{initials}</span>
                <div className="min-w-0"><p className="truncate text-sm font-bold text-white">{userName ?? 'Usuario'}</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-400">{roleLabel}</p><span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300"><span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-400" />Activo</span></div>
            </div>

            <nav className="flex flex-1 flex-col gap-1.5" aria-label="Navegación del dashboard">
                <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Navegación</p>
                {navigation.map(({ href, icon: Icon, label, badge }) => {
                    const active = pathname === href || (href !== navigation[0]?.href && pathname.startsWith(`${href}/`))

                    return (
                        <Link
                            className={`flex items-center justify-between gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${active ? 'bg-cyan-500/15 text-cyan-100 shadow-sm ring-1 ring-cyan-500/30' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                                }`}
                            href={href}
                            key={href}
                        >
                            <span className="flex min-w-0 items-center gap-3"><Icon aria-hidden="true" className="size-4 shrink-0" /><span className="truncate">{label}</span></span>
                            {badge ? <span className="flex shrink-0 items-center gap-2"><span className="rounded-full bg-cyan-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-[#0d1117]">{badge > 99 ? '99+' : badge}</span>{active && <span aria-hidden="true" className="size-1.5 rounded-full bg-cyan-400" />}</span> : active && <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-cyan-400" />}
                        </Link>
                    )
                })}
            </nav>

            {switchOptions.length > 0 && (
                <div className="mt-6 border-t border-neutral-800 pt-4">
                    <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Cambiar de rol</p>
                    <div className="flex flex-col gap-1.5">
                        {switchOptions.map(({ href, shortLabel, icon: Icon }) => (
                            <Link className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white" href={href} key={href}>
                                <Icon aria-hidden="true" className="size-4" />{shortLabel}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-6 border-t border-neutral-800 pt-4">
                <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-neutral-400 transition-colors hover:bg-red-950/50 hover:text-red-300" onClick={onSignOut} type="button"><LogOut aria-hidden="true" className="size-4" />Cerrar sesión</button>
            </div>
        </aside>
    )
}