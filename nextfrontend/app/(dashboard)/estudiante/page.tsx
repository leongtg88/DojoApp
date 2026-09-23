import { auth } from '@/auth'
import { StudentDashboardOverview } from '@/components/dashboard/student/StudentDashboardOverview'
import { FamilyQuickSwitcher } from '@/components/dashboard/student/FamilyQuickSwitcher'
import { getStudentDashboardSummary, getStudentKataProgress } from '@/lib/dashboard/student-queries'
import { getFamilyMembers, resolveStudentView } from '@/lib/family/guardians'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

interface StudentDashboardPageProps {
    searchParams: Promise<{ estudiante?: string }>
}

export default async function StudentDashboardPage({ searchParams }: StudentDashboardPageProps) {
    const session = await auth()

    if (!session?.user?.id || !hasAnyRole(session?.user, ['STUDENT', 'GUARDIAN'])) {
        redirect('/no-autorizado')
    }

    const userId = session.user.id

    if (!userId) {
        redirect('/no-autorizado')
    }

    const { estudiante } = await searchParams
    const view = await resolveStudentView(userId, estudiante)

    if (!view) {
        redirect('/no-autorizado')
    }

    const summary = await getStudentDashboardSummary(view.studentId)

    if (!summary) {
        return (
            <main className="mx-auto max-w-6xl px-6 py-10">
                <h1 className="font-display text-2xl font-bold text-ink">Tu perfil de estudiante aún no está disponible.</h1>
                <p className="mt-2 text-sm text-ink-3">Contacta a la administración del dojo para completar tu registro.</p>
            </main>
        )
    }

    const kataSummary = await getStudentKataProgress(view.studentId)

    const familyMembers = hasAnyRole(session.user, ['GUARDIAN']) ? await getFamilyMembers(userId) : null

    return (
        <>
            {familyMembers && (
                <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
                    <FamilyQuickSwitcher members={familyMembers} currentStudentId={view.studentId} baseHref="/dashboard/estudiante" />
                </div>
            )}
            <StudentDashboardOverview kataSummary={kataSummary} summary={summary} />
        </>
    )
}