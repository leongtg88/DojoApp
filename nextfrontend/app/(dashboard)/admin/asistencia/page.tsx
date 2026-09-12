import { auth } from '@/auth'
import { AdminAttendanceBoard } from '@/components/dashboard/admin/AdminAttendanceBoard'
import { AdminAttendanceReport } from '@/components/dashboard/admin/AdminAttendanceReport'
import { getAdminAttendance } from '@/lib/dashboard/admin-queries'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

export default async function AdminAttendancePage() {
    const session = await auth()
    const userId = session?.user?.id

    if (!hasAnyRole(session?.user, ['SCHOOL_ADMIN', 'SUPERADMIN']) || !userId) {
        redirect('/no-autorizado')
    }

    const records = await getAdminAttendance(userId)

    if (!records) {
        redirect('/no-autorizado')
    }

    return (
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400">Administración</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-white">Asistencia</h1>
            <section className="mt-6 space-y-6">
                <div>
                    <h2 className="mb-3 font-display text-lg font-bold text-white">Revisión de registros</h2>
                    <AdminAttendanceBoard />
                </div>
                <div>
                    <h2 className="mb-3 font-display text-lg font-bold text-white">Reporte general</h2>
                    <AdminAttendanceReport records={records} />
                </div>
            </section>
        </main>
    )
}