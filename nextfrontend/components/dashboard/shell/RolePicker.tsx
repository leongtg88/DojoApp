'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { DashboardRole } from '@/types/dashboard'
import { getRolePanelOptions } from './RolePanels'

interface RolePickerProps {
    roles: DashboardRole[]
    userName: string | null | undefined
}

export function RolePicker({ roles, userName }: RolePickerProps) {
    const options = getRolePanelOptions(roles)

    return (
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <p className="font-display text-2xl font-extrabold text-white sm:text-3xl">
                {userName ? `¡Hola, ${userName}!` : 'Bienvenido'}
            </p>
            <p className="mt-2 text-sm text-neutral-400">Tienes acceso a varios paneles. Elige desde dónde quieres entrar.</p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {options.map(({ role, href, label, icon: Icon }) => (
                    <Link
                        className="group flex items-center gap-4 rounded-xl border border-neutral-700 bg-[#161b22] p-6 shadow-sm transition-colors hover:border-cyan-500/60 hover:bg-[#1b2431]"
                        href={href}
                        key={role}
                    >
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
                            <Icon aria-hidden="true" className="size-6" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-bold text-white">{label}</span>
                            <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-neutral-500 transition-colors group-hover:text-cyan-400">
                                Entrar <ChevronRight aria-hidden="true" className="size-3" />
                            </span>
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    )
}