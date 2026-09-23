import { auth } from '@/auth'
import { StudentSchedule } from '@/components/dashboard/student/StudentSchedule'
import { getStudentSchedule } from '@/lib/dashboard/student-queries'
import { resolveStudentView } from '@/lib/family/guardians'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

interface StudentSchedulePageProps {
    searchParams: Promise<{ estudiante?: string }>
}

export default async function StudentSchedulePage({ searchParams }: StudentSchedulePageProps) {
    const session = await auth()

    if (!session?.user?.id || !hasAnyRole(session?.user, ['STUDENT', 'GUARDIAN'])) {
        redirect('/no-autorizado')
    }

    const { estudiante } = await searchParams
    const view = await resolveStudentView(session.user.id, estudiante)

    if (!view) {
        redirect('/no-autorizado')
    }

    const classes = await getStudentSchedule(view.studentId)

    if (!classes) {
        redirect('/dashboard/estudiante')
    }

    return <StudentSchedule classes={classes} />
}