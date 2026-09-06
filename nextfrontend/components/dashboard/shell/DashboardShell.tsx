'use client'

import type { ReactNode } from 'react'
import type { DashboardRole } from '@/types/dashboard'
import { DashboardSidebar } from './DashboardSidebar'
import { MobileDashboardNav } from './MobileDashboardNav'

interface DashboardShellProps {
    children: ReactNode
    role: DashboardRole
    userName: string | null | undefined
}

export function DashboardShell({ children, role, userName }: DashboardShellProps) {
    return (
        <div className="min-h-screen bg-[#f7f4ef] pb-16 md:pb-0">
            <header className="sticky top-0 z-30 border-b border-[#e5e2e1] bg-[#fcf9f8]/95 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div>
                        <p className="font-display text-base font-extrabold text-[#1c1b1b] sm:text-lg">TOSEI GUSOKU</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a7400]">Portal del dojo</p>
                    </div>
                    <p className="max-w-44 truncate text-right text-sm font-semibold text-[#5c403c]">{userName ?? 'Usuario'}</p>
                </div>
            </header>

            <div className="mx-auto flex max-w-7xl">
                <DashboardSidebar role={role} userName={userName} />
                <div className="min-w-0 flex-1">{children}</div>
            </div>

            <MobileDashboardNav role={role} />
        </div>
    )
}
