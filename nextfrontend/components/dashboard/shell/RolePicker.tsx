'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { DashboardRole } from '@/types/dashboard'
import { getRolePanelOptions } from './RolePanels'
import { ThemeToggle } from '../theme/ThemeToggle'

interface RolePickerProps {
    roles: DashboardRole[]
    userName: string | null | undefined
}

export function RolePicker({ roles, userName }: RolePickerProps) {
    const options = getRolePanelOptions(roles)

    return (
        <div className="min-h-screen bg-surface-1">
            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                <header className="flex flex-col items-center text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/LogoRectangularblanco.svg" alt="Tosei Gusoku Dojo" className="h-10 w-auto sm:h-12" />
                    <div className="mt-4">
                        <ThemeToggle />
                    </div>
                </header>

                <p className="mt-10 font-display text-2xl font-extrabold text-ink sm:text-3xl">
                    {userName ? `¡Hola, ${userName}!` : 'Bienvenido'}
                </p>
                <p className="mt-2 text-sm text-ink-3">Tienes acceso a varios paneles. Elige desde dónde quieres entrar.</p>

                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                    {options.map(({ role, href, label, icon: Icon }) => (
                        <Link
                            className="group flex items-center gap-4 rounded-xl border border-edge-strong bg-surface-2 p-6 shadow-sm transition-colors hover:border-cyan-500/60 hover:bg-surface-3"
                            href={href}
                            key={role}
                        >
                            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-accent">
                                <Icon aria-hidden="true" className="size-6" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-bold text-ink">{label}</span>
                                <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-ink-4 transition-colors group-hover:text-accent">
                                    Entrar <ChevronRight aria-hidden="true" className="size-3" />
                                </span>
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
