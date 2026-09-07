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

    const roles = session.user.roles as DashboardRole[]

    if (!roles.some((role) => ['STUDENT', 'INSTRUCTOR', 'SCHOOL_ADMIN', 'SUPERADMIN'].includes(role))) {
        redirect('/no-autorizado')
    }

    return <DashboardShell roles={roles} userName={session.user.name} primaryRole={roles[0]}>{children}</DashboardShell>
}