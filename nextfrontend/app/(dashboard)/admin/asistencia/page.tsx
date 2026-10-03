import { auth } from '@/auth'
import { AdminAttendanceView } from '@/components/dashboard/admin/AdminAttendanceView'
import { AdminExpectedAttendance } from '@/components/dashboard/admin/AdminExpectedAttendance'
import { getAdminAttendanceRoster, getAdminSchedules } from '@/lib/dashboard/admin-queries'
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
    const roster = selectedClassId ? await getAdminAttendanceRoster(userId, selectedClassId, date) : null

    return (
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Administración</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">Asistencia</h1>
            <p className="mt-2 text-sm text-ink-3">Compara los alumnos esperados por clase con los registros del día y audita los punch-in pendientes de tu escuela.</p>
            <div className="mt-6">
                <AdminExpectedAttendance classes={classes} date={date} roster={roster} selectedClassId={selectedClassId} />
            </div>
            <div className="mt-6">
                <AdminAttendanceView />
            </div>
        </main>
    )
}
