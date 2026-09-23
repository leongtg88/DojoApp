import { auth } from '@/auth'
import { StudentProgressOverview } from '@/components/dashboard/student/StudentProgressOverview'
import { getStudentDashboardSummary, getStudentKataProgress } from '@/lib/dashboard/student-queries'
import { resolveStudentView } from '@/lib/family/guardians'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

interface StudentProgressPageProps {
    searchParams: Promise<{ estudiante?: string }>
}

export default async function StudentProgressPage({ searchParams }: StudentProgressPageProps) {
    const session = await auth()

    if (!session?.user?.id || !hasAnyRole(session?.user, ['STUDENT', 'GUARDIAN'])) {
        redirect('/no-autorizado')
    }

    const { estudiante } = await searchParams
    const view = await resolveStudentView(session.user.id, estudiante)

    if (!view) {
        redirect('/no-autorizado')
    }

    const [kataSummary, summary] = await Promise.all([getStudentKataProgress(view.studentId), getStudentDashboardSummary(view.studentId)])

    if (!kataSummary || !summary) {
        redirect('/dashboard/estudiante')
    }

    return <StudentProgressOverview kataSummary={kataSummary} summary={summary} />
}