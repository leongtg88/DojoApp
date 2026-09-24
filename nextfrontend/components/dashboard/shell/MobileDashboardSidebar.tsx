'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { LogOut, X } from 'lucide-react'
import type { DashboardRole } from '@/types/dashboard'
import type { FamilyView } from '@/lib/family/guardians'
import { getRoleNavigation } from './RoleNavigation'
import { getPanelHref, getRolePanelOptions } from './RolePanels'
import { FamilyMemberSwitcher } from './FamilyMemberSwitcher'
import { NotificationBell } from './NotificationBell'
import { ThemeToggle } from '../theme/ThemeToggle'

interface MobileDashboardSidebarProps {
    open: boolean
    onClose: () => void
    onSignOut: () => void
    activeRole: DashboardRole
    roles: DashboardRole[]
    userName: string | null | undefined
    pendingEnrollmentCount?: number
    pendingDocumentCount?: number
    unreadNotificationCount?: number
    familyMembers?: FamilyView
}

export function MobileDashboardSidebar({ open, onClose, onSignOut, activeRole, roles, userName, pendingEnrollmentCount = 0, pendingDocumentCount = 0, unreadNotificationCount = 0, familyMembers }: MobileDashboardSidebarProps) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const activeStudentId = searchParams.get('estudiante')
    const navigation = getRoleNavigation(activeRole, pendingEnrollmentCount, pendingDocumentCount)
    const activeHref = getPanelHref(activeRole)
    const currentHref = navigation
        .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
        .sort((a, b) => b.href.length - a.href.length)[0]?.href
    const switchOptions = getRolePanelOptions(roles).filter((option) => option.href !== activeHref)
    const initials = (userName ?? 'Usuario').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    const roleLabel = activeRole === 'STUDENT' ? 'Estudiante' : activeRole === 'INSTRUCTOR' ? 'Instructor' : 'Administrador'
    const withStudentContext = (href: string) => {
        if (activeRole !== 'STUDENT' || !activeStudentId) return href
        return `${href}${href.includes('?') ? '&' : '?'}estudiante=${encodeURIComponent(activeStudentId)}`
    }

    // Bloquea el scroll del fondo mientras el drawer está abierto.
    useEffect(() => {
        if (!open) return
        const previous = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = previous
        }
    }, [open])

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 md:hidden print:hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.button
                        aria-label="Cerrar menú"
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={onClose}
                        type="button"
                    />
                    <motion.aside
                        className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-edge bg-surface-2 p-4 shadow-2xl"
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 font-display text-sm font-extrabold text-accent-text">{initials}</span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-ink">{userName ?? 'Usuario'}</p>
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-accent">{roleLabel}</p>
                                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-ok-text"><span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-400" />Sesión activa</span>
                                </div>
                            </div>
                            <button aria-label="Cerrar menú" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink" onClick={onClose} type="button">
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="mt-6 flex items-center justify-between border-b border-edge pb-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-4">Navegación</p>
                            <div className="flex items-center gap-1">
                                <ThemeToggle />
                                <NotificationBell initialUnreadCount={unreadNotificationCount} />
                            </div>
                        </div>

                        <nav className="mt-4 flex flex-col gap-1.5" aria-label="Navegación del menú móvil">
                            {navigation.map(({ href, icon: Icon, label, badge }) => {
                                const active = href === currentHref

                                return (
                                    <Link
                                        className={`flex items-center justify-between gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${active ? 'bg-cyan-500/15 text-accent-text shadow-sm ring-1 ring-cyan-500/30' : 'text-ink-3 hover:bg-surface-3 hover:text-ink'}`}
                                        href={withStudentContext(href)}
                                        key={href}
                                        onClick={onClose}
                                    >
                                        <span className="flex min-w-0 items-center gap-3"><Icon aria-hidden="true" className="size-4 shrink-0" /><span className="truncate">{label}</span></span>
                                        {badge ? <span className="rounded-full bg-cyan-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-[#0d1117]">{badge > 99 ? '99+' : badge}</span> : active && <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-cyan-400" />}
                                    </Link>
                                )
                            })}
                        </nav>

                        {familyMembers && activeRole === 'STUDENT' && (
                            <div className="mt-5 border-t border-edge pt-4">
                                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-ink-4">Cuenta familiar</p>
                                <div className="px-2">
                                    <FamilyMemberSwitcher members={familyMembers} />
                                </div>
                            </div>
                        )}

                        {switchOptions.length > 0 && (
                            <div className="mt-5 border-t border-edge pt-4">
                                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-ink-4">Cambiar de rol</p>
                                <div className="flex flex-col gap-1.5">
                                    {switchOptions.map(({ href, shortLabel, icon: Icon }) => (
                                        <Link className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink" href={href} key={href} onClick={onClose}>
                                            <Icon aria-hidden="true" className="size-4" />{shortLabel}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-auto border-t border-edge pt-4">
                            <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-ink-3 transition-colors hover:bg-red-950/50 hover:text-danger-text" onClick={onSignOut} type="button"><LogOut aria-hidden="true" className="size-4" />Cerrar sesión</button>
                        </div>
                    </motion.aside>
                </motion.div>
            )}
        </AnimatePresence>
    )
}