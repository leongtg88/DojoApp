import { auth } from '@/auth'
import { StudentProgressOverview } from '@/components/dashboard/student/StudentProgressOverview'
import { getStudentDashboardSummary, getStudentKataProgress } from '@/lib/dashboard/student-queries'
import { redirect } from 'next/navigation'
import { hasRole } from '@/lib/auth/roles'

export default async function StudentProgressPage() {
    if (!hasRole((await auth())?.user, 'STUDENT')) {
        redirect('/no-autorizado')
    }

    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
        redirect('/no-autorizado')
    }

    const [kataSummary, summary] = await Promise.all([getStudentKataProgress(userId), getStudentDashboardSummary(userId)])

    if (!kataSummary || !summary) {
        redirect('/dashboard/estudiante')
    }

    return <StudentProgressOverview kataSummary={kataSummary} summary={summary} />
}