import { auth } from '@/auth'
import { AdminAttendanceView } from '@/components/dashboard/admin/AdminAttendanceView'
import { AdminExpectedControls } from '@/components/dashboard/admin/AdminExpectedControls'
import { AdminExpectedSummary } from '@/components/dashboard/admin/AdminExpectedSummary'
import { AdminExpectedTable } from '@/components/dashboard/admin/AdminExpectedTable'
import { getAdminAttendanceRoster, getAdminSchedules } from '@/lib/dashboard/admin-queries'
import { ensureClassAbsences } from '@/lib/dashboard/attendance-absences'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

interface AdminAttendancePageProps {
    searchParams: Promise<{ classId?: string; date?: string }>
}

export default async function AdminAttendancePage({ searchParams }: AdminAttendancePageProps) {
    const session = await auth()
    const userId = session?.user?.id

    if (!hasAnyRole(session?.user, ['SCHOOL_ADMIN', 'SUPERADMIN']) || !userId) {
        redirect('/no-autorizado')
    }

    const parameters = await searchParams
    const classes = (await getAdminSchedules(userId)) ?? []
    const activeClasses = classes.filter((scheduledClass) => scheduledClass.active)
    const selectedClassId = parameters.classId || activeClasses[0]?.id || null
    const date = parameters.date && /^\d{4}-\d{2}-\d{2}$/.test(parameters.date) ? parameters.date : new Date().toISOString().slice(0, 10)

    if (selectedClassId) {
        await ensureClassAbsences(userId, selectedClassId, date)
    }

    const roster = selectedClassId ? await getAdminAttendanceRoster(userId, selectedClassId, date) : null

    return (
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Administración</p>
            <h1 className="mt-2 font-display text-2xl font-extrabold text-ink">Asistencia</h1>
            <div className="mt-6 space-y-6">
                {roster && <AdminExpectedSummary roster={roster} />}
                <AdminAttendanceView />
                <AdminExpectedControls classes={classes} date={date} hasRoster={Boolean(roster)} selectedClassId={selectedClassId} />
                {roster && <AdminExpectedTable roster={roster} />}
            </div>
        </main>
    )
}
