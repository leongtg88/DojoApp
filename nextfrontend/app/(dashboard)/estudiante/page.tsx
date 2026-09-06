import { auth } from '@/auth'
import { StudentDashboardOverview } from '@/components/dashboard/student/StudentDashboardOverview'
import { getStudentDashboardSummary } from '@/lib/dashboard/student-queries'
import { redirect } from 'next/navigation'

export default async function StudentDashboardPage() {
    const session = await auth()

    if (session?.user?.role !== 'STUDENT') {
        redirect('/dashboard/no-autorizado')
    }

    const summary = await getStudentDashboardSummary(session.user.id)

    if (!summary) {
        return (
            <main className="mx-auto max-w-6xl px-6 py-10">
                <h1 className="font-display text-2xl font-bold text-[#1c1b1b]">Tu perfil de estudiante aún no está disponible.</h1>
                <p className="mt-2 text-sm text-[#5c403c]">Contacta a la administración del dojo para completar tu registro.</p>
            </main>
        )
    }

    return <StudentDashboardOverview summary={summary} />
}