import type { ReactNode } from 'react'
import { auth } from '@/auth'
import { DashboardShell } from '@/components/dashboard/shell/DashboardShell'
import type { DashboardRole } from '@/types/dashboard'
import { hasAnyRole } from '@/lib/auth/roles'
import { getAdminPendingEnrollmentCount } from '@/lib/dashboard/admin-queries'
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
    const pendingEnrollmentCount = hasAnyRole(session.user, ['SCHOOL_ADMIN', 'SUPERADMIN']) ? await getAdminPendingEnrollmentCount(session.user.id) : 0

    return <DashboardShell roles={roles} userName={session.user.name} primaryRole={primaryRole} pendingEnrollmentCount={pendingEnrollmentCount}>{children}</DashboardShell>
}