import { auth } from '@/auth'
import { StudentDashboardOverview } from '@/components/dashboard/student/StudentDashboardOverview'
import { getStudentDashboardSummary, getStudentKataProgress } from '@/lib/dashboard/student-queries'
import { redirect } from 'next/navigation'
import { hasRole } from '@/lib/auth/roles'

export default async function StudentDashboardPage() {
    const session = await auth()

    if (!session?.user?.id || !hasRole(session?.user, 'STUDENT')) {
        redirect('/no-autorizado')
    }

    const userId = session.user.id

    if (!userId) {
        redirect('/no-autorizado')
    }

    const summary = await getStudentDashboardSummary(userId)

    if (!summary) {
        return (
            <main className="mx-auto max-w-6xl px-6 py-10">
                <h1 className="font-display text-2xl font-bold text-white">Tu perfil de estudiante aún no está disponible.</h1>
                <p className="mt-2 text-sm text-neutral-400">Contacta a la administración del dojo para completar tu registro.</p>
            </main>
        )
    }

    const kataSummary = await getStudentKataProgress(userId)

    return <StudentDashboardOverview kataSummary={kataSummary} summary={summary} />
}