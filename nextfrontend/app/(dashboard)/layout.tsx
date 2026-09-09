import type { ReactNode } from 'react'
import { auth } from '@/auth'
import { DashboardShell } from '@/components/dashboard/shell/DashboardShell'
import type { DashboardRole } from '@/types/dashboard'
import { hasAnyRole } from '@/lib/auth/roles'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const session = await auth()

    if (!session?.user?.id) {
        redirect('/login')
    }

    if (!hasAnyRole(session.user, ['STUDENT', 'INSTRUCTOR', 'SCHOOL_ADMIN', 'SUPERADMIN'])) {
        redirect('/no-autorizado')
    }

    const primaryRole = session.user.role as DashboardRole
    const roles = (session.user.roles && session.user.roles.length > 0 ? session.user.roles : [primaryRole]) as DashboardRole[]

    return <DashboardShell roles={roles} userName={session.user.name} primaryRole={primaryRole}>{children}</DashboardShell>
}