'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutGrid, LogOut } from 'lucide-react'
import type { DashboardRole } from '@/types/dashboard'
import { getPanelHref } from './RolePanels'
import { DashboardSidebar } from './DashboardSidebar'
import { MobileDashboardNav } from './MobileDashboardNav'

interface DashboardShellProps {
    children: ReactNode
    roles: DashboardRole[]
    primaryRole: DashboardRole
    userName: string | null | undefined
    pendingEnrollmentCount?: number
}

function resolveActiveRole(pathname: string, roles: DashboardRole[], primaryRole: DashboardRole): DashboardRole {
    if (pathname.startsWith(getPanelHref('STUDENT'))) return 'STUDENT'
    if (pathname.startsWith(getPanelHref('INSTRUCTOR'))) return 'INSTRUCTOR'
    if (pathname.startsWith(getPanelHref('SCHOOL_ADMIN'))) {
        return roles.includes('SUPERADMIN') ? 'SUPERADMIN' : roles.includes('SCHOOL_ADMIN') ? 'SCHOOL_ADMIN' : primaryRole
    }
    return primaryRole
}

export function DashboardShell({ children, roles, primaryRole, userName, pendingEnrollmentCount }: DashboardShellProps) {
    const pathname = usePathname()
    const activeRole = resolveActiveRole(pathname, roles, primaryRole)
    const initials = (userName ?? 'Usuario').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    const roleLabel = activeRole === 'STUDENT' ? 'Portal del estudiante' : activeRole === 'INSTRUCTOR' ? 'Panel de instructor' : 'Administración del dojo'

    function handleSignOut() {
        void signOut({ redirectTo: '/login' })
    }

    return (
        <div className="min-h-screen bg-[#0d1117] pb-16 text-neutral-100 md:pb-0">
            <header className="sticky top-0 z-30 border-b border-neutral-800 bg-[#161b22]/95 shadow-[0_1px_8px_rgba(0,0,0,0.35)] backdrop-blur">
                <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <span aria-hidden="true" className="h-8 w-1.5 bg-cyan-500" />
                        <div>
                            <p className="font-display text-base font-extrabold text-white sm:text-lg">TOSEI GUSOKU</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">{roleLabel}</p>
                        </div>
                    </div>
                    <div className="flex min-w-0 items-center gap-2.5"><div className="hidden min-w-0 text-right sm:block"><p className="max-w-44 truncate text-sm font-bold text-white">{userName ?? 'Usuario'}</p><p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Sesión activa</p></div><span aria-label="Usuario activo" className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-cyan-400/50 bg-cyan-500/20 font-display text-xs font-extrabold text-cyan-100 shadow-sm">{initials}</span>{roles.length > 1 && (<Link aria-label="Cambiar de panel" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white md:hidden" href="/dashboard" title="Cambiar de panel"><LayoutGrid aria-hidden="true" className="size-4" /></Link>)}<button aria-label="Cerrar sesión" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-red-950/50 hover:text-red-300" onClick={handleSignOut} title="Cerrar sesión" type="button"><LogOut aria-hidden="true" className="size-4" /></button></div>
                </div>
            </header>

            <div className="flex w-full">
                <DashboardSidebar onSignOut={handleSignOut} activeRole={activeRole} roles={roles} userName={userName} pendingEnrollmentCount={pendingEnrollmentCount} />
                <div className="min-w-0 flex-1">{children}</div>
            </div>

            <MobileDashboardNav activeRole={activeRole} pendingEnrollmentCount={pendingEnrollmentCount} />
        </div>
    )
}
