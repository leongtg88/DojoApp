import { auth } from '@/auth'
import { AdminAttendanceView } from '@/components/dashboard/admin/AdminAttendanceView'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

export default async function AdminAttendancePage() {
    const session = await auth()
    const userId = session?.user?.id

    if (!hasAnyRole(session?.user, ['SCHOOL_ADMIN', 'SUPERADMIN']) || !userId) {
        redirect('/no-autorizado')
    }

    return (
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Administración</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">Asistencia</h1>
            <p className="mt-2 text-sm text-ink-3">Registros de asistencia dentro del alcance de tu escuela. Filtra y revisa los punch-in pendientes.</p>
            <div className="mt-6">
                <AdminAttendanceView />
            </div>
        </main>
    )
}
