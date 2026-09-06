import type { ReactNode } from 'react'
import { auth } from '@/auth'
import { DashboardShell } from '@/components/dashboard/shell/DashboardShell'
import type { DashboardRole } from '@/types/dashboard'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const session = await auth()

    if (!session?.user?.id) {
        redirect('/login')
    }

    const role = session.user.role as DashboardRole

    if (!['STUDENT', 'INSTRUCTOR', 'SCHOOL_ADMIN', 'SUPERADMIN'].includes(role)) {
        redirect('/dashboard/no-autorizado')
    }

    return <DashboardShell role={role} userName={session.user.name}>{children}</DashboardShell>
}