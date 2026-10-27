import { auth } from '@/auth'
import { StudentAbsenceReport } from '@/components/dashboard/student/StudentAbsenceReport'
import { StudentAttendanceRecords } from '@/components/dashboard/student/StudentAttendanceRecords'
import { StudentOnlineRecoveries } from '@/components/dashboard/student/StudentOnlineRecoveries'
import { StudentSchedule } from '@/components/dashboard/student/StudentSchedule'
import { getStudentAttendancePunchData } from '@/lib/dashboard/student-queries'
import { resolveStudentView } from '@/lib/family/guardians'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

interface StudentClassesPageProps {
    searchParams: Promise<{ estudiante?: string }>
}

/**
 * UX-B1 · Destino "Clases": horario, reportar inasistencia e historial.
 * Reutiliza los componentes existentes; no cambia ninguna API.
 */
export default async function StudentClassesPage({ searchParams }: StudentClassesPageProps) {
    const session = await auth()

    if (!session?.user?.id || !hasAnyRole(session?.user, ['STUDENT', 'GUARDIAN'])) {
        redirect('/no-autorizado')
    }

    const { estudiante } = await searchParams
    const view = await resolveStudentView(session.user.id, estudiante)

    if (!view) {
        redirect('/no-autorizado')
    }

    const data = await getStudentAttendancePunchData(view.studentId)

    if (!data) {
        redirect('/dashboard/estudiante')
    }

    return (
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Portal del estudiante</p>
            <h1 className="mt-2 font-display text-2xl font-extrabold text-ink">Mis clases</h1>
            <p className="mt-2 text-xs text-ink-3">Tu horario, el reporte de inasistencias y tu historial de entrenamientos.</p>

            <div className="mt-7 space-y-6">
                <StudentSchedule classes={data.schedule} embedded />
                <StudentAbsenceReport justifications={data.justifications} schedule={data.schedule} studentId={view.studentId} />
                <StudentOnlineRecoveries recoveries={data.onlineRecoveries} />
                <StudentAttendanceRecords records={data.records} />
            </div>
        </main>
    )
}
