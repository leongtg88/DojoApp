'use client'

import { useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LogOut, Menu } from 'lucide-react'
import type { DashboardRole } from '@/types/dashboard'
import type { FamilyView } from '@/lib/family/guardians'
import { getPanelHref } from './RolePanels'
import { DashboardSidebar } from './DashboardSidebar'
import { MobileDashboardSidebar } from './MobileDashboardSidebar'
import { MobileDashboardNav } from './MobileDashboardNav'
import { NotificationBell } from './NotificationBell'
import { FamilyMemberSwitcher } from './FamilyMemberSwitcher'
import { ThemeToggle } from '../theme/ThemeToggle'
import { DashboardLogo } from '../shared/DashboardLogo'

interface DashboardShellProps {
    children: ReactNode
    roles: DashboardRole[]
    primaryRole: DashboardRole
    userName: string | null | undefined
    pendingEnrollmentCount?: number
    pendingDocumentCount?: number
    unreadNotificationCount?: number
    familyMembers?: FamilyView
}

function resolveActiveRole(pathname: string, roles: DashboardRole[], primaryRole: DashboardRole): DashboardRole {
    if (pathname.startsWith(getPanelHref('STUDENT'))) return 'STUDENT'
    if (pathname.startsWith(getPanelHref('INSTRUCTOR'))) return 'INSTRUCTOR'
    if (pathname.startsWith(getPanelHref('SCHOOL_ADMIN'))) {
        return roles.includes('SUPERADMIN') ? 'SUPERADMIN' : roles.includes('SCHOOL_ADMIN') ? 'SCHOOL_ADMIN' : primaryRole
    }
    return primaryRole
}

export function DashboardShell({ children, roles, primaryRole, userName, pendingEnrollmentCount, pendingDocumentCount, unreadNotificationCount, familyMembers }: DashboardShellProps) {
    const pathname = usePathname()
    const activeRole = resolveActiveRole(pathname, roles, primaryRole)
    const initials = (userName ?? 'Usuario').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    function handleSignOut() {
        void signOut({ redirectTo: '/login' })
    }

    return (
        <div className="min-h-screen bg-surface-1 pb-16 text-ink md:pb-0">
            <header className="sticky top-0 z-30 border-b border-edge bg-surface-2/95 shadow-[0_1px_8px_rgba(0,0,0,0.35)] backdrop-blur print:hidden">
                <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center">
                        <DashboardLogo className="h-8 w-auto " />
                    </div>

                    <div className="flex min-w-0 items-center gap-2.5">
                        {familyMembers && activeRole === 'STUDENT' && (
                            <>
                                <span className="md:hidden"><FamilyMemberSwitcher iconOnly members={familyMembers} /></span>
                                <span className="hidden md:inline-flex"><FamilyMemberSwitcher members={familyMembers} /></span>
                            </>
                        )}
                        <div className="hidden items-center gap-2.5 md:flex">
                            <ThemeToggle />
                            <NotificationBell initialUnreadCount={unreadNotificationCount} />
                            <div className="hidden min-w-0 text-right sm:block"><p className="max-w-44 truncate text-sm font-bold text-ink">{userName ?? 'Usuario'}</p><p className="text-[10px] font-semibold uppercase tracking-wide text-ink-4">Sesión activa</p></div>
                            <span aria-label="Usuario activo" className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-cyan-400/50 bg-cyan-500/20 font-display text-xs font-extrabold text-accent-text shadow-sm">{initials}</span>
                        </div>
                        <button aria-label="Cerrar sesión" className="hidden size-9 shrink-0 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-red-950/50 hover:text-danger-text md:flex" onClick={handleSignOut} title="Cerrar sesión" type="button"><LogOut aria-hidden="true" className="size-4" /></button>
                        <button aria-label="Abrir menú" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink md:hidden" onClick={() => setMobileMenuOpen(true)} type="button">
                            <Menu aria-hidden="true" className="size-5" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex w-full">
                <DashboardSidebar onSignOut={handleSignOut} activeRole={activeRole} roles={roles} userName={userName} pendingEnrollmentCount={pendingEnrollmentCount} pendingDocumentCount={pendingDocumentCount} familyMembers={familyMembers} />
                <div className="min-w-0 flex-1">{children}</div>
            </div>

            <MobileDashboardNav activeRole={activeRole} pendingEnrollmentCount={pendingEnrollmentCount} pendingDocumentCount={pendingDocumentCount} />

            <MobileDashboardSidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} onSignOut={handleSignOut} activeRole={activeRole} roles={roles} userName={userName} pendingEnrollmentCount={pendingEnrollmentCount} pendingDocumentCount={pendingDocumentCount} unreadNotificationCount={unreadNotificationCount} familyMembers={familyMembers} />
        </div>
    )
}
