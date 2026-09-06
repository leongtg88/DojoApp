'use client'

import type { ReactNode } from 'react'
import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import type { DashboardRole } from '@/types/dashboard'
import { DashboardSidebar } from './DashboardSidebar'
import { MobileDashboardNav } from './MobileDashboardNav'

interface DashboardShellProps {
    children: ReactNode
    role: DashboardRole
    userName: string | null | undefined
}

export function DashboardShell({ children, role, userName }: DashboardShellProps) {
    const initials = (userName ?? 'Usuario').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    const roleLabel = role === 'STUDENT' ? 'Portal del estudiante' : role === 'INSTRUCTOR' ? 'Panel de instructor' : 'Administración del dojo'

    function handleSignOut() {
        void signOut({ redirectTo: '/login' })
    }

    return (
        <div className="min-h-screen bg-[#0d1117] pb-16 text-neutral-100 md:pb-0">
            <header className="sticky top-0 z-30 border-b border-neutral-800 bg-[#161b22]/95 shadow-[0_1px_8px_rgba(0,0,0,0.35)] backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <span aria-hidden="true" className="h-8 w-1.5 bg-cyan-500" />
                        <div>
                            <p className="font-display text-base font-extrabold text-white sm:text-lg">TOSEI GUSOKU</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">{roleLabel}</p>
                        </div>
                    </div>
                    <div className="flex min-w-0 items-center gap-2.5"><div className="hidden min-w-0 text-right sm:block"><p className="max-w-44 truncate text-sm font-bold text-white">{userName ?? 'Usuario'}</p><p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Sesión activa</p></div><span aria-label="Usuario activo" className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-cyan-400/50 bg-cyan-500/20 font-display text-xs font-extrabold text-cyan-100 shadow-sm">{initials}</span><button aria-label="Cerrar sesión" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-red-950/50 hover:text-red-300" onClick={handleSignOut} title="Cerrar sesión" type="button"><LogOut aria-hidden="true" className="size-4" /></button></div>
                </div>
            </header>

            <div className="mx-auto flex max-w-7xl">
                <DashboardSidebar onSignOut={handleSignOut} role={role} userName={userName} />
                <div className="min-w-0 flex-1">{children}</div>
            </div>

            <MobileDashboardNav onSignOut={handleSignOut} role={role} />
        </div>
    )
}
