import { auth } from '@/auth'
import { StudentProgressOverview } from '@/components/dashboard/student/StudentProgressOverview'
import { getStudentDashboardSummary } from '@/lib/dashboard/student-queries'
import { redirect } from 'next/navigation'

export default async function StudentProgressPage() {
    if ((await auth())?.user?.role !== 'STUDENT') {
        redirect('/dashboard/no-autorizado')
    }

    const session = await auth()
    const summary = session?.user?.id ? await getStudentDashboardSummary(session.user.id) : null

    if (!summary) {
        redirect('/dashboard/estudiante')
    }

    return <StudentProgressOverview summary={summary} />
}