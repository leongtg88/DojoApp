import { auth } from '@/auth'
import { StudentProgressOverview } from '@/components/dashboard/student/StudentProgressOverview'
import { getStudentDashboardSummary, getStudentKataProgress } from '@/lib/dashboard/student-queries'
import { redirect } from 'next/navigation'

export default async function StudentProgressPage() {
    if ((await auth())?.user?.role !== 'STUDENT') {
        redirect('/dashboard/no-autorizado')
    }

    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
        redirect('/dashboard/no-autorizado')
    }

    const [kataSummary, summary] = await Promise.all([getStudentKataProgress(userId), getStudentDashboardSummary(userId)])

    if (!kataSummary || !summary) {
        redirect('/dashboard/estudiante')
    }

    return <StudentProgressOverview kataSummary={kataSummary} summary={summary} />
}