import { auth } from '@/auth'
import { StudentAttendancePunch } from '@/components/dashboard/student/StudentAttendancePunch'
import { getStudentAttendancePunchData, getStudentKataProgress } from '@/lib/dashboard/student-queries'
import { redirect } from 'next/navigation'
import { hasRole } from '@/lib/auth/roles'

export default async function StudentAttendancePage() {
    const session = await auth()

    if (!session?.user?.id || !hasRole(session?.user, 'STUDENT')) {
        redirect('/no-autorizado')
    }

    const [data, kataSummary] = await Promise.all([
        getStudentAttendancePunchData(session.user.id),
        getStudentKataProgress(session.user.id),
    ])

    if (!data) {
        redirect('/dashboard/estudiante')
    }

    return (
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Mi asistencia</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">Punch &amp; Seguimiento</h1>
            <p className="mt-2 text-sm text-ink-3">Marca tus prácticas y el Sensei confirma al finalizar el tatami.</p>
            <section className="mt-7">
                <StudentAttendancePunch data={data} grado={kataSummary?.grado ?? null} />
            </section>
        </main>
    )
}