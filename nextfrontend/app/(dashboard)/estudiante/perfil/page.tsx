import { auth } from '@/auth'
import { StudentProfileDetails } from '@/components/dashboard/student/StudentProfileDetails'
import { StudentProfileForm } from '@/components/dashboard/student/StudentProfileForm'
import { getStudentDashboardSummary } from '@/lib/dashboard/student-queries'
import { redirect } from 'next/navigation'

export default async function StudentProfilePage() {
    if ((await auth())?.user?.role !== 'STUDENT') {
        redirect('/dashboard/no-autorizado')
    }

    const session = await auth()
    const summary = session?.user?.id ? await getStudentDashboardSummary(session.user.id) : null

    if (!summary) {
        redirect('/dashboard/estudiante')
    }

    return (
        <>
            <StudentProfileDetails profile={summary.profile} />
            <div className="mx-auto max-w-4xl px-4 pb-8 sm:px-6 lg:px-8">
                <StudentProfileForm profile={summary.profile} />
            </div>
        </>
    )
}